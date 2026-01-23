const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function uploadFast() {
  try {
    console.log('🚀 เริ่มอัปโหลดเร็ว...');
    
    const backupFile = 'D:\\stock-backups\\stock-backup-2026-01-20T07-21-58-221Z.json';
    
    // อ่านไฟล์ทีละส่วน
    console.log('📖 กำลังอ่านไฟล์...');
    const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log(`📊 พบ ${data.data.length} รายการ`);
    console.log('🔥 เริ่มอัปโหลดทันที...');
    
    let success = 0;
    
    for (let i = 0; i < data.data.length; i++) {
      const item = data.data[i];
      
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
        
        success++;
        
        if (success % 100 === 0) {
          console.log(`✅ อัปโหลดไป ${success} รายการ`);
        }
        
      } catch (err) {
        // ข้ามรายการซ้ำ
      }
    }
    
    console.log(`🎉 เสร็จ! อัปโหลด ${success} รายการ`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

uploadFast();
