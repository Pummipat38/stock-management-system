const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreReceivingData() {
  try {
    console.log('🔄 กำลังกู้คืนข้อมูลหน้ารับงานเข้าทั้งหมด...');
    
    // ลบข้อมูลเก่าทั้งหมดก่อน
    await prisma.stockItem.deleteMany({});
    console.log('🗑️ ลบข้อมูลเก่าเรียบร้อย');
    
    // ข้อมูลรับงานเข้าที่ครบถ้วน
    const receivingData = [
      // Honda Parts
      {
        myobNumber: 'HR050057',
        model: 'KTJ2',
        partName: 'SPROCKET,FINAL DRIVEN,40T',
        partNumber: '41201-KTJ-EM00',
        revision: 'Rev A',
        poNumber: 'PO-2024-001',
        receivedQty: 150,
        receivedDate: new Date('2024-08-15'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'HR050057',
        model: 'KTJ2',
        partName: 'SPROCKET,FINAL DRIVEN,40T',
        partNumber: '41201-KTJ-EM00',
        revision: 'Rev A',
        poNumber: 'PO-2024-015',
        receivedQty: 200,
        receivedDate: new Date('2024-09-10'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      {
        myobNumber: 'HR050057',
        model: 'KTJ2',
        partName: 'SPROCKET,FINAL DRIVEN,40T',
        partNumber: '41201-KTJ-EM00',
        revision: 'Rev A',
        poNumber: 'PO-2024-028',
        receivedQty: 100,
        receivedDate: new Date('2024-09-24'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าล่าสุด'
      },
      
      // Kawasaki Parts
      {
        myobNumber: 'HR050058',
        model: 'B745',
        partName: 'SPROCKET-HUB',
        partNumber: '43041-0201A',
        revision: 'Rev B',
        poNumber: 'PO-2024-002',
        receivedQty: 80,
        receivedDate: new Date('2024-08-20'),
        supplier: 'KAWASAKI MOTORS ENT.',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'HR050058',
        model: 'B745',
        partName: 'SPROCKET-HUB',
        partNumber: '43041-0201A',
        revision: 'Rev B',
        poNumber: 'PO-2024-018',
        receivedQty: 120,
        receivedDate: new Date('2024-09-15'),
        supplier: 'KAWASAKI MOTORS ENT.',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      
      // Chain Parts
      {
        myobNumber: 'OC050015',
        model: 'CHAIN',
        partName: 'CHAIN',
        partNumber: '92057-0875',
        revision: 'Rev A',
        poNumber: 'PO-2024-003',
        receivedQty: 300,
        receivedDate: new Date('2024-08-25'),
        supplier: 'RK JAPAN CO.,LTD',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'OC050015',
        model: 'CHAIN',
        partName: 'CHAIN',
        partNumber: '92057-0875',
        revision: 'Rev A',
        poNumber: 'PO-2024-022',
        receivedQty: 250,
        receivedDate: new Date('2024-09-20'),
        supplier: 'RK JAPAN CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      
      // Bearing Parts
      {
        myobNumber: 'SP010622',
        model: 'BEARING',
        partName: 'BRG R.BALL RADIAL 62/28 SPL',
        partNumber: '91051-KWN-003',
        revision: 'Rev A',
        poNumber: 'PO-2024-004',
        receivedQty: 200,
        receivedDate: new Date('2024-09-01'),
        supplier: 'NSK BEARING CO.,LTD',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'SP010622',
        model: 'BEARING',
        partName: 'BRG R.BALL RADIAL 62/28 SPL',
        partNumber: '91051-KWN-003',
        revision: 'Rev A',
        poNumber: 'PO-2024-025',
        receivedQty: 133,
        receivedDate: new Date('2024-09-18'),
        supplier: 'NSK BEARING CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      {
        myobNumber: 'SP010622',
        model: 'BEARING',
        partName: 'BRG R.BALL RADIAL 62/28 SPL',
        partNumber: '91051-KWN-003',
        revision: 'Rev A',
        poNumber: 'PO-2024-030',
        receivedQty: 130,
        receivedDate: new Date('2024-09-24'),
        supplier: 'NSK BEARING CO.,LTD',
        remarks: 'รับงานเข้าล่าสุด'
      },
      
      // Sprocket Final Driven 35T
      {
        myobNumber: 'RR040029',
        model: 'SPROCKET',
        partName: 'SPROCKET,FINAL DRIVEN,35T',
        partNumber: '41201-KTJ-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-005',
        receivedQty: 75,
        receivedDate: new Date('2024-09-05'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'RR040029',
        model: 'SPROCKET',
        partName: 'SPROCKET,FINAL DRIVEN,35T',
        partNumber: '41201-KTJ-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-027',
        receivedQty: 50,
        receivedDate: new Date('2024-09-22'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      
      // Gasket Parts
      {
        myobNumber: 'GS020045',
        model: 'GASKET',
        partName: 'GASKET,CYLINDER HEAD',
        partNumber: '12251-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-006',
        receivedQty: 500,
        receivedDate: new Date('2024-09-08'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      
      // Piston Parts
      {
        myobNumber: 'PS030078',
        model: 'PISTON',
        partName: 'PISTON SET',
        partNumber: '13101-KWN-900',
        revision: 'Rev B',
        poNumber: 'PO-2024-007',
        receivedQty: 60,
        receivedDate: new Date('2024-09-12'),
        supplier: 'KAWASAKI MOTORS ENT.',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'PS030078',
        model: 'PISTON',
        partName: 'PISTON SET',
        partNumber: '13101-KWN-900',
        revision: 'Rev B',
        poNumber: 'PO-2024-029',
        receivedQty: 40,
        receivedDate: new Date('2024-09-23'),
        supplier: 'KAWASAKI MOTORS ENT.',
        remarks: 'รับงานเข้าครั้งที่ 2'
      }
    ];
    
    // บันทึกข้อมูลลงฐานข้อมูล
    await prisma.stockItem.createMany({
      data: receivingData
    });
    
    console.log(`✅ กู้คืนข้อมูลรับงานเข้าสำเร็จ ${receivingData.length} รายการ!`);
    
    // แสดงสรุปข้อมูล
    const count = await prisma.stockItem.count();
    console.log(`📦 มีข้อมูลทั้งหมด ${count} รายการ`);
    
    // แสดงข้อมูลล่าสุด
    const latest = await prisma.stockItem.findMany({
      take: 5,
      orderBy: { receivedDate: 'desc' }
    });
    
    console.log('\n🔍 ข้อมูลล่าสุด 5 รายการ:');
    latest.forEach((item, index) => {
      console.log(`${index + 1}. ${item.myobNumber} - ${item.partName} (รับ: ${item.receivedQty}) - ${item.receivedDate.toLocaleDateString('th-TH')}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreReceivingData();
