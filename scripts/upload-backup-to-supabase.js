const fs = require('fs');
const path = require('path');

// ตั้งค่า Supabase connection (จาก .env)
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function uploadBackupToSupabase() {
  try {
    console.log('🔄 เริ่มอัปโหลดข้อมูลจาก backup ขึ้น Supabase...');

    // อ่านไฟล์ backup ล่าสุด
    const backupDir = 'D:\\stock-backups';
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('stock-backup-') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (backupFiles.length === 0) {
      console.log('❌ ไม่พบไฟล์ backup');
      return;
    }

    const latestBackupFile = path.join(backupDir, backupFiles[0]);
    console.log(`📁 ใช้ไฟล์ backup: ${latestBackupFile}`);

    const backupData = JSON.parse(fs.readFileSync(latestBackupFile, 'utf8'));
    
    if (!backupData.data || !Array.isArray(backupData.data)) {
      console.log('❌ รูปแบบไฟล์ backup ไม่ถูกต้อง');
      return;
    }

    console.log(`📊 พบข้อมูล ${backupData.data.length} รายการ`);

    // อัปโหลดข้อมูลทีละรายการ
    let successCount = 0;
    let errorCount = 0;

    for (const item of backupData.data) {
      try {
        // ตรวจสอบว่ามีรายการนี้อยู่แล้วหรือไม่ (ตรวจจาก partNumber + poNumber + receivedDate)
        const existingItem = await prisma.stockItem.findFirst({
          where: {
            partNumber: item.partNumber,
            poNumber: item.poNumber,
            receivedDate: new Date(item.receivedDate)
          }
        });

        if (existingItem) {
          console.log(`⚠️  ข้ามรายการซ้ำ: ${item.partNumber} (${item.poNumber})`);
          continue;
        }

        // แปลงข้อมูลให้ตรงกับ schema
        const stockItemData = {
          myobNumber: item.myobNumber,
          model: item.model,
          partName: item.partName,
          partNumber: item.partNumber,
          revision: item.revision || '',
          poNumber: item.poNumber,
          receivedQty: item.receivedQty,
          receivedDate: new Date(item.receivedDate),
          supplier: item.supplier || null,
          customer: item.customer || null,
          issuedQty: item.issuedQty || null,
          invoiceNumber: item.invoiceNumber || null,
          issueDate: item.issueDate ? new Date(item.issueDate) : null,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          event: item.event || null,
          withdrawalNumber: item.withdrawalNumber || null,
          remarks: item.remarks || null,
        };

        // สร้างรายการใหม่
        await prisma.StockItem.create({
          data: stockItemData
        });

        console.log(`✅ อัปโหลดสำเร็จ: ${item.partNumber} - ${item.partName}`);
        successCount++;

      } catch (error) {
        console.error(`❌ อัปโหลดล้มเหลว: ${item.partNumber}`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 เสร็จสิ้น!`);
    console.log(`✅ สำเร็จ: ${successCount} รายการ`);
    console.log(`❌ ล้มเหลว: ${errorCount} รายการ`);

    // สร้าง transaction records สำหรับการรับเข้า
    console.log('\n🔄 กำลังสร้างรายการ transactions...');
    let transactionCount = 0;

    for (const item of backupData.data) {
      try {
        // ตรวจสอบว่ามีรายการนี้อยู่แล้วหรือไม่
        const existingItem = await prisma.StockItem.findFirst({
          where: {
            partNumber: item.partNumber,
            poNumber: item.poNumber || '', // ใช้ค่าว่างถ้าไม่มี poNumber
            receivedDate: new Date(item.receivedDate)
          }
        });

        if (existingItem) {
          await prisma.Transaction.create({
            data: {
              stockItemId: existingItem.id,
              type: 'RECEIVE',
              quantity: item.receivedQty,
              transactionDate: new Date(item.receivedDate),
              remarks: `อัปโหลดจาก backup: ${item.poNumber}`
            }
          });
          transactionCount++;
        }
      } catch (error) {
        console.error(`❌ สร้าง transaction ล้มเหลว: ${item.partNumber}`, error.message);
      }
    }

    console.log(`✅ สร้าง transactions สำเร็จ: ${transactionCount} รายการ`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// รันสคริปต์
uploadBackupToSupabase();
