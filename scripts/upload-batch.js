const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function uploadBatch() {
  try {
    console.log('🚀 เริ่มอัปโหลดแบบ batch...');
    
    const backupFile = 'D:\\stock-backups\\stock-backup-2026-01-20T07-21-58-221Z.json';
    
    // อ่านไฟล์
    console.log('📖 อ่านไฟล์ backup...');
    const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log(`📊 พบทั้งหมด ${data.data.length} รายการ`);
    
    // ตรวจสอบว่ามีอยู่แล้วกี่รายการ
    const existingCount = await prisma.StockItem.count();
    console.log(`📈 มีอยู่แล้วในฐานข้อมูล: ${existingCount} รายการ`);
    
    // อัปโหลดทีละ 50 รายการ
    const batchSize = 50;
    let totalUploaded = 0;
    
    for (let i = existingCount; i < data.data.length; i += batchSize) {
      const batch = data.data.slice(i, i + batchSize);
      console.log(`\n🔄 อัปโหลด batch ${Math.floor(i/batchSize) + 1}: รายการ ${i+1}-${Math.min(i+batchSize, data.data.length)}`);
      
      let batchSuccess = 0;
      
      for (const item of batch) {
        try {
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
          batchSuccess++;
        } catch (err) {
          // ข้ามรายการซ้ำ
        }
      }
      
      totalUploaded += batchSuccess;
      console.log(`✅ Batch สำเร็จ: ${batchSuccess}/${batch.length} รายการ`);
      console.log(`📊 รวมทั้งหมด: ${totalUploaded + existingCount}/${data.data.length} รายการ`);
      
      // รอเล็กน้อยก่อน batch ถัดไป
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 เสร็จสิ้น!`);
    console.log(`✅ อัปโหลดสำเร็จทั้งหมด: ${totalUploaded + existingCount} รายการ`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

uploadBatch();
