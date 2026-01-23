require('dotenv').config({path: '.env'});
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function resetAndUpload() {
  try {
    console.log('🔄 ลบข้อมูลเก่าทั้งหมด...');
    
    // ลบข้อมูลทั้งหมด
    await prisma.StockItem.deleteMany({});
    console.log('✅ ลบข้อมูลเก่าเรียบร้อย');
    
    console.log('📖 อ่านไฟล์ backup...');
    const backupFile = 'D:\\stock-backups\\stock-backup-2026-01-20T07-21-58-221Z.json';
    const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log(`📊 จะอัปโหลด ${data.data.length} รายการ`);
    
    // อัปโหลดทีละ batch
    const batchSize = 100;
    let uploaded = 0;
    
    for (let i = 0; i < data.data.length; i += batchSize) {
      const batch = data.data.slice(i, i + batchSize);
      
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
          uploaded++;
        } catch (err) {
          console.log(`❌ ล้มเหลว: ${item.partNumber}`);
        }
      }
      
      console.log(`✅ อัปโหลดไปแล้ว ${uploaded}/${data.data.length} รายการ`);
    }
    
    console.log(`🎉 เสร็จสิ้น! อัปโหลด ${uploaded} รายการ`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAndUpload();
