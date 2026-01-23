const fs = require('fs');
const path = require('path');

// ตั้งค่า Supabase connection
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function uploadLargeBackup() {
  try {
    console.log('🔄 เริ่มอัปโหลดไฟล์ backup ใหญ่...');

    // เลือกไฟล์ที่ใหญ่ที่สุดโดยตรง
    const largeFile = 'D:\\stock-backups\\stock-backup-2026-01-20T07-21-58-221Z.json';
    
    if (!fs.existsSync(largeFile)) {
      console.log('❌ ไม่พบไฟล์ backup ใหญ่');
      return;
    }

    const fileSize = fs.statSync(largeFile).size;
    console.log(`📁 ใช้ไฟล์ใหญ่: stock-backup-2026-01-20T07-21-58-221Z.json (${(fileSize/1024).toFixed(2)} KB)`);

    // อ่านข้อมูล
    const data = JSON.parse(fs.readFileSync(largeFile, 'utf8'));
    console.log(`📊 พบข้อมูลทั้งหมด: ${data.data.length} รายการ`);

    // แสดงตัวอย่าง 5 รายการแรก
    console.log('\n📝 ตัวอย่างข้อมูล:');
    data.data.slice(0, 5).forEach((item, i) => {
      console.log(`  ${i+1}. ${item.partNumber || 'ไม่มี Part#'} - ${item.partName || 'ไม่มีชื่อ'} (${item.receivedQty || 0} ชิ้น)`);
    });

    // อัปโหลดทันที
    console.log('\n🚀 กำลังอัปโหลดข้อมูลจริง...');
    let success = 0;
    let skip = 0;
    let error = 0;

    for (const item of data.data) {
      try {
        // ตรวจสอบซ้ำ
        const exists = await prisma.StockItem.findFirst({
          where: {
            partNumber: item.partNumber || '',
            poNumber: item.poNumber || '',
            receivedDate: new Date(item.receivedDate)
          }
        });

        if (exists) {
          skip++;
          continue;
        }

        // สร้างใหม่
        await prisma.StockItem.create({
          data: {
            myobNumber: item.myobNumber || '',
            model: item.model || '',
            partName: item.partName || '',
            partNumber: item.partNumber || '',
            revision: item.revision || '',
            poNumber: item.poNumber || '',
            receivedQty: parseInt(item.receivedQty) || 0,
            receivedDate: new Date(item.receivedDate),
            supplier: item.supplier || null,
            customer: item.customer || null,
            issuedQty: item.issuedQty ? parseInt(item.issuedQty) : null,
            invoiceNumber: item.invoiceNumber || null,
            issueDate: item.issueDate ? new Date(item.issueDate) : null,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            event: item.event || null,
            withdrawalNumber: item.withdrawalNumber || null,
            remarks: item.remarks || null,
          }
        });

        success++;
        if (success % 20 === 0) {
          console.log(`✅ อัปโหลดไปแล้ว ${success} รายการ...`);
        }

      } catch (err) {
        console.log(`❌ ล้มเหลว: ${item.partNumber || 'ไม่มี Part#'} - ${err.message}`);
        error++;
      }
    }

    console.log(`\n🎉 เสร็จสิ้น!`);
    console.log(`✅ อัปโหลดสำเร็จ: ${success} รายการ`);
    console.log(`⚠️ ข้ามซ้ำ: ${skip} รายการ`);
    console.log(`❌ ล้มเหลว: ${error} รายการ`);
    
    if (success > 0) {
      console.log('\n🎊 ข้อมูลจริงๆ อัปโหลดขึ้น Supabase แล้ว!');
      console.log('📊 ตรวจสอบได้ที่ Supabase Table Editor');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// รันเลย
uploadLargeBackup();
