const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    const count = await prisma.stockItem.count();
    console.log('📦 จำนวนข้อมูลทั้งหมด:', count);
    
    if (count > 0) {
      const sample = await prisma.stockItem.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('🔍 ตัวอย่างข้อมูล 5 รายการล่าสุด:');
      sample.forEach((item, index) => {
        console.log(`${index + 1}. ${item.myobNumber} - ${item.partName} (รับ: ${item.receivedQty}, จ่าย: ${item.issuedQty || 0})`);
      });
    } else {
      console.log('❌ ไม่มีข้อมูลในฐานข้อมูล');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
