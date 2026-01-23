const fs = require('fs');
const path = require('path');

// ตั้งค่า Supabase connection
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function uploadBackup() {
  try {
    console.log('🔄 เริ่มอัปโหลดข้อมูลจาก backup...');

    // หาไฟล์ backup ที่ใหญ่ที่สุด
    const backupDir = 'D:\\stock-backups';
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        size: fs.statSync(path.join(backupDir, f)).size
      }))
      .sort((a, b) => b.size - a.size);

    if (files.length === 0) {
      console.log('❌ ไม่พบไฟล์ backup');
      return;
    }

    const selectedFile = files[0];
    console.log(`📁 ใช้ไฟล์: ${selectedFile.name} (${(selectedFile.size/1024).toFixed(2)} KB)`);

    // อ่านข้อมูล
    const data = JSON.parse(fs.readFileSync(selectedFile.path, 'utf8'));
    console.log(`📊 พบข้อมูล ${data.data.length} รายการ`);

    // แสดงตัวอย่าง 3 รายการแรก
    console.log('\n📝 ตัวอย่างข้อมูล:');
    data.data.slice(0, 3).forEach((item, i) => {
      console.log(`  ${i+1}. ${item.partNumber} - ${item.partName} (${item.receivedQty || 0} ชิ้น)`);
    });

    // อัปโหลดทันที
    console.log('\n🚀 กำลังอัปโหลด...');
    let success = 0;
    let skip = 0;

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
        if (success % 10 === 0) console.log(`✅ อัปโหลดไปแล้ว ${success} รายการ`);

      } catch (error) {
        console.log(`❌ ล้มเหลว: ${item.partNumber || 'ไม่มี Part#'}`);
      }
    }

    console.log(`\n🎉 เสร็จสิ้น!`);
    console.log(`✅ อัปโหลดสำเร็จ: ${success} รายการ`);
    console.log(`⚠️ ข้ามซ้ำ: ${skip} รายการ`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// รันเลย
uploadBackup();
