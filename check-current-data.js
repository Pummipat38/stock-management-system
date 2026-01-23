const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentData() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูลปัจจุบันในฐานข้อมูล...');
    
    // นับจำนวนข้อมูลทั้งหมด
    const totalCount = await prisma.stockItem.count();
    console.log(`📦 จำนวนข้อมูลทั้งหมด: ${totalCount} รายการ`);
    
    if (totalCount > 0) {
      // แสดงข้อมูลล่าสุด 10 รายการ
      const latestItems = await prisma.stockItem.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('\n📋 ข้อมูลล่าสุด 10 รายการ:');
      latestItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.myobNumber} - ${item.partName}`);
        console.log(`   รับเข้า: ${item.receivedQty} ชิ้น, วันที่: ${item.receivedDate.toLocaleDateString('th-TH')}`);
        console.log(`   PO: ${item.poNumber}, Supplier: ${item.supplier || 'N/A'}`);
        console.log('');
      });
      
      // สรุปตาม Part Number
      const partSummary = await prisma.stockItem.groupBy({
        by: ['myobNumber', 'partName'],
        _count: { id: true },
        _sum: { receivedQty: true }
      });
      
      console.log(`\n📊 สรุปตาม Part Number (${partSummary.length} parts):`);
      partSummary.forEach((item, index) => {
        console.log(`${index + 1}. ${item.myobNumber} - ${item.partName}`);
        console.log(`   รายการ: ${item._count.id}, รวมรับเข้า: ${item._sum.receivedQty} ชิ้น`);
      });
      
      // หายอดรวมทั้งหมด
      const totalReceived = await prisma.stockItem.aggregate({
        _sum: { receivedQty: true }
      });
      
      console.log(`\n🎯 ยอดรับเข้าทั้งหมด: ${totalReceived._sum.receivedQty} ชิ้น`);
      
      // ข้อมูลตามช่วงเวลา
      const dateRange = await prisma.stockItem.aggregate({
        _min: { receivedDate: true },
        _max: { receivedDate: true }
      });
      
      console.log(`📅 ช่วงเวลาข้อมูล: ${dateRange._min.receivedDate.toLocaleDateString('th-TH')} ถึง ${dateRange._max.receivedDate.toLocaleDateString('th-TH')}`);
      
    } else {
      console.log('❌ ไม่มีข้อมูลในฐานข้อมูล');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentData();
