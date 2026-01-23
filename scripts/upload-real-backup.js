const fs = require('fs');
const path = require('path');

// ตั้งค่า Supabase connection
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function uploadRealBackup() {
  try {
    console.log('🔄 เริ่มอัปโหลดข้อมูลจริงจาก backup ใหญ่...');

    // ใช้ไฟล์ backup ที่ใหญ่ที่สุด
    const backupFile = 'D:\\stock-backups\\stock-backup-2026-01-20T07-21-58-221Z.json';
    
    console.log('📁 กำลังอ่านไฟล์ backup ใหญ่...');
    
    // อ่านไฟล์แบบ sync
    const fileContent = fs.readFileSync(backupFile, 'utf8');
    const data = JSON.parse(fileContent);
    
    console.log(`📊 พบข้อมูลทั้งหมด: ${data.data.length} รายการ`);
    console.log(`📈 สรุป: รับเข้า ${data.metadata.totalReceived} ชิ้น, จ่ายออก ${data.metadata.totalIssued} ชิ้น`);

    // แสดงตัวอย่าง 5 รายการแรก
    console.log('\n📝 ตัวอย่างข้อมูล:');
    data.data.slice(0, 5).forEach((item, i) => {
      console.log(`  ${i+1}. ${item.partNumber} - ${item.partName} (รับ: ${item.receivedQty || 0}, จ่าย: ${item.issuedQty || 0})`);
    });

    // ยืนยันก่อนอัปโหลด
    console.log(`\n⚠️  กำลังจะอัปโหลด ${data.data.length} รายการ ขึ้น Supabase`);
    console.log('กด Ctrl+C เพื่อยกเลิก หรือรอ 3 วินาทีเพื่อดำเนินการ...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // อัปโหลดข้อมูล
    console.log('\n🚀 เริ่มอัปโหลดข้อมูลจริง...');
    let success = 0;
    let skip = 0;
    let error = 0;

    for (let i = 0; i < data.data.length; i++) {
      const item = data.data[i];
      
      try {
        // ตรวจสอบซ้ำด้วย partNumber + poNumber + receivedDate
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

        // สร้างรายการใหม่
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
        
        // แสดงผลทุก 50 รายการ
        if (success % 50 === 0) {
          console.log(`✅ อัปโหลดไปแล้ว ${success}/${data.data.length} รายการ...`);
        }

      } catch (err) {
        console.log(`❌ ล้มเหลวรายการที่ ${i+1}: ${item.partNumber || 'ไม่มี Part#'} - ${err.message}`);
        error++;
      }
    }

    console.log(`\n🎉 เสร็จสิ้นการอัปโหลด!`);
    console.log(`✅ อัปโหลดสำเร็จ: ${success} รายการ`);
    console.log(`⚠️ ข้ามซ้ำ: ${skip} รายการ`);
    console.log(`❌ ล้มเหลว: ${error} รายการ`);
    
    if (success > 0) {
      console.log('\n🎊 ข้อมูลจริงๆ ${success} รายการ อัปโหลดขึ้น Supabase แล้ว!');
      console.log('📊 ตรวจสอบได้ที่ Supabase Table Editor → StockItem');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// รันเลย
uploadRealBackup();
