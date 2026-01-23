const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreFullData() {
  try {
    console.log('🔄 กำลังกู้คืนข้อมูลทั้งหมดในระบบ...');
    
    // ลบข้อมูลเก่าทั้งหมดก่อน
    await prisma.stockItem.deleteMany({});
    console.log('🗑️ ลบข้อมูลเก่าเรียบร้อย');
    
    // ข้อมูลรับงานเข้าที่ครบถ้วนและหลากหลาย
    const fullReceivingData = [
      // Honda Parts - SPROCKET,FINAL DRIVEN,40T
      {
        myobNumber: 'HR050057',
        model: 'KTJ2',
        partName: 'SPROCKET,FINAL DRIVEN,40T',
        partNumber: '41201-KTJ-EM00',
        revision: 'Rev A',
        poNumber: 'PO-2024-001',
        receivedQty: 150,
        receivedDate: new Date('2024-07-15'),
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
        receivedDate: new Date('2024-08-10'),
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
        receivedDate: new Date('2024-09-05'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 3'
      },
      {
        myobNumber: 'HR050057',
        model: 'KTJ2',
        partName: 'SPROCKET,FINAL DRIVEN,40T',
        partNumber: '41201-KTJ-EM00',
        revision: 'Rev A',
        poNumber: 'PO-2024-035',
        receivedQty: 175,
        receivedDate: new Date('2024-09-20'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 4'
      },
      {
        myobNumber: 'HR050057',
        model: 'KTJ2',
        partName: 'SPROCKET,FINAL DRIVEN,40T',
        partNumber: '41201-KTJ-EM00',
        revision: 'Rev A',
        poNumber: 'PO-2024-042',
        receivedQty: 125,
        receivedDate: new Date('2024-09-24'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าล่าสุด'
      },
      
      // Kawasaki Parts - SPROCKET-HUB
      {
        myobNumber: 'HR050058',
        model: 'B745',
        partName: 'SPROCKET-HUB',
        partNumber: '43041-0201A',
        revision: 'Rev B',
        poNumber: 'PO-2024-002',
        receivedQty: 80,
        receivedDate: new Date('2024-07-20'),
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
        receivedDate: new Date('2024-08-15'),
        supplier: 'KAWASAKI MOTORS ENT.',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      {
        myobNumber: 'HR050058',
        model: 'B745',
        partName: 'SPROCKET-HUB',
        partNumber: '43041-0201A',
        revision: 'Rev B',
        poNumber: 'PO-2024-031',
        receivedQty: 90,
        receivedDate: new Date('2024-09-12'),
        supplier: 'KAWASAKI MOTORS ENT.',
        remarks: 'รับงานเข้าครั้งที่ 3'
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
        receivedDate: new Date('2024-07-25'),
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
        receivedDate: new Date('2024-08-28'),
        supplier: 'RK JAPAN CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      {
        myobNumber: 'OC050015',
        model: 'CHAIN',
        partName: 'CHAIN',
        partNumber: '92057-0875',
        revision: 'Rev A',
        poNumber: 'PO-2024-038',
        receivedQty: 400,
        receivedDate: new Date('2024-09-18'),
        supplier: 'RK JAPAN CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 3'
      },
      
      // Bearing Parts - BRG R.BALL RADIAL 62/28 SPL
      {
        myobNumber: 'SP010622',
        model: 'BEARING',
        partName: 'BRG R.BALL RADIAL 62/28 SPL',
        partNumber: '91051-KWN-003',
        revision: 'Rev A',
        poNumber: 'PO-2024-004',
        receivedQty: 200,
        receivedDate: new Date('2024-08-01'),
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
        receivedDate: new Date('2024-09-08'),
        supplier: 'NSK BEARING CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      {
        myobNumber: 'SP010622',
        model: 'BEARING',
        partName: 'BRG R.BALL RADIAL 62/28 SPL',
        partNumber: '91051-KWN-003',
        revision: 'Rev A',
        poNumber: 'PO-2024-040',
        receivedQty: 130,
        receivedDate: new Date('2024-09-22'),
        supplier: 'NSK BEARING CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 3'
      },
      {
        myobNumber: 'SP010622',
        model: 'BEARING',
        partName: 'BRG R.BALL RADIAL 62/28 SPL',
        partNumber: '91051-KWN-003',
        revision: 'Rev A',
        poNumber: 'PO-2024-045',
        receivedQty: 150,
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
        receivedDate: new Date('2024-08-05'),
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
        receivedDate: new Date('2024-09-10'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      {
        myobNumber: 'RR040029',
        model: 'SPROCKET',
        partName: 'SPROCKET,FINAL DRIVEN,35T',
        partNumber: '41201-KTJ-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-041',
        receivedQty: 60,
        receivedDate: new Date('2024-09-23'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 3'
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
        receivedDate: new Date('2024-08-08'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'GS020045',
        model: 'GASKET',
        partName: 'GASKET,CYLINDER HEAD',
        partNumber: '12251-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-032',
        receivedQty: 300,
        receivedDate: new Date('2024-09-15'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 2'
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
        receivedDate: new Date('2024-08-12'),
        supplier: 'KAWASAKI MOTORS ENT.',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'PS030078',
        model: 'PISTON',
        partName: 'PISTON SET',
        partNumber: '13101-KWN-900',
        revision: 'Rev B',
        poNumber: 'PO-2024-033',
        receivedQty: 40,
        receivedDate: new Date('2024-09-16'),
        supplier: 'KAWASAKI MOTORS ENT.',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      
      // เพิ่มรายการใหม่ที่หลากหลาย
      
      // Valve Parts
      {
        myobNumber: 'VL040012',
        model: 'VALVE',
        partName: 'VALVE,INTAKE',
        partNumber: '12711-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-008',
        receivedQty: 120,
        receivedDate: new Date('2024-08-18'),
        supplier: 'KAWASAKI MOTORS ENT.',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'VL040012',
        model: 'VALVE',
        partName: 'VALVE,INTAKE',
        partNumber: '12711-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-034',
        receivedQty: 80,
        receivedDate: new Date('2024-09-19'),
        supplier: 'KAWASAKI MOTORS ENT.',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      
      // Clutch Parts
      {
        myobNumber: 'CL050089',
        model: 'CLUTCH',
        partName: 'CLUTCH PLATE',
        partNumber: '13089-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-009',
        receivedQty: 200,
        receivedDate: new Date('2024-08-22'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'CL050089',
        model: 'CLUTCH',
        partName: 'CLUTCH PLATE',
        partNumber: '13089-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-036',
        receivedQty: 150,
        receivedDate: new Date('2024-09-21'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      
      // Brake Parts
      {
        myobNumber: 'BR060034',
        model: 'BRAKE',
        partName: 'BRAKE PAD SET',
        partNumber: '43082-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-010',
        receivedQty: 100,
        receivedDate: new Date('2024-08-25'),
        supplier: 'NISSIN KOGYO CO.,LTD',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'BR060034',
        model: 'BRAKE',
        partName: 'BRAKE PAD SET',
        partNumber: '43082-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-037',
        receivedQty: 75,
        receivedDate: new Date('2024-09-17'),
        supplier: 'NISSIN KOGYO CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      
      // Filter Parts
      {
        myobNumber: 'FL070056',
        model: 'FILTER',
        partName: 'OIL FILTER',
        partNumber: '15410-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-011',
        receivedQty: 300,
        receivedDate: new Date('2024-07-30'),
        supplier: 'MAHLE FILTER SYSTEMS',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'FL070056',
        model: 'FILTER',
        partName: 'OIL FILTER',
        partNumber: '15410-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-026',
        receivedQty: 250,
        receivedDate: new Date('2024-09-02'),
        supplier: 'MAHLE FILTER SYSTEMS',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      {
        myobNumber: 'FL070056',
        model: 'FILTER',
        partName: 'OIL FILTER',
        partNumber: '15410-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-043',
        receivedQty: 200,
        receivedDate: new Date('2024-09-24'),
        supplier: 'MAHLE FILTER SYSTEMS',
        remarks: 'รับงานเข้าล่าสุด'
      },
      
      // Spark Plug Parts
      {
        myobNumber: 'SP080023',
        model: 'SPARK',
        partName: 'SPARK PLUG',
        partNumber: '92070-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-012',
        receivedQty: 500,
        receivedDate: new Date('2024-08-03'),
        supplier: 'NGK SPARK PLUG CO.,LTD',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'SP080023',
        model: 'SPARK',
        partName: 'SPARK PLUG',
        partNumber: '92070-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-029',
        receivedQty: 400,
        receivedDate: new Date('2024-09-11'),
        supplier: 'NGK SPARK PLUG CO.,LTD',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      
      // Carburetor Parts
      {
        myobNumber: 'CB090067',
        model: 'CARB',
        partName: 'CARBURETOR ASSY',
        partNumber: '15003-KWN-900',
        revision: 'Rev B',
        poNumber: 'PO-2024-013',
        receivedQty: 50,
        receivedDate: new Date('2024-08-14'),
        supplier: 'KEIHIN CORPORATION',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'CB090067',
        model: 'CARB',
        partName: 'CARBURETOR ASSY',
        partNumber: '15003-KWN-900',
        revision: 'Rev B',
        poNumber: 'PO-2024-039',
        receivedQty: 30,
        receivedDate: new Date('2024-09-20'),
        supplier: 'KEIHIN CORPORATION',
        remarks: 'รับงานเข้าครั้งที่ 2'
      },
      
      // Exhaust Parts
      {
        myobNumber: 'EX100045',
        model: 'EXHAUST',
        partName: 'EXHAUST PIPE',
        partNumber: '18300-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-014',
        receivedQty: 25,
        receivedDate: new Date('2024-08-20'),
        supplier: 'THAI HONDA CO.,LTD',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      
      // Suspension Parts
      {
        myobNumber: 'SU110078',
        model: 'SUSPENSION',
        partName: 'SHOCK ABSORBER',
        partNumber: '52400-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-016',
        receivedQty: 40,
        receivedDate: new Date('2024-08-26'),
        supplier: 'SHOWA CORPORATION',
        remarks: 'รับงานเข้าครั้งแรก'
      },
      {
        myobNumber: 'SU110078',
        model: 'SUSPENSION',
        partName: 'SHOCK ABSORBER',
        partNumber: '52400-KWN-900',
        revision: 'Rev A',
        poNumber: 'PO-2024-044',
        receivedQty: 35,
        receivedDate: new Date('2024-09-23'),
        supplier: 'SHOWA CORPORATION',
        remarks: 'รับงานเข้าครั้งที่ 2'
      }
    ];
    
    // บันทึกข้อมูลลงฐานข้อมูล
    await prisma.stockItem.createMany({
      data: fullReceivingData
    });
    
    console.log(`✅ กู้คืนข้อมูลรับงานเข้าสำเร็จ ${fullReceivingData.length} รายการ!`);
    
    // แสดงสรุปข้อมูล
    const count = await prisma.stockItem.count();
    console.log(`📦 มีข้อมูลทั้งหมด ${count} รายการ`);
    
    // แสดงข้อมูลตาม Part Number
    const partSummary = await prisma.stockItem.groupBy({
      by: ['myobNumber', 'partName'],
      _count: {
        id: true
      },
      _sum: {
        receivedQty: true
      }
    });
    
    console.log('\n📊 สรุปข้อมูลตาม Part:');
    partSummary.forEach((item, index) => {
      console.log(`${index + 1}. ${item.myobNumber} - ${item.partName}`);
      console.log(`   จำนวนรายการ: ${item._count.id} รายการ, รวมรับเข้า: ${item._sum.receivedQty} ชิ้น`);
    });
    
    // แสดงข้อมูลล่าสุด
    const latest = await prisma.stockItem.findMany({
      take: 10,
      orderBy: { receivedDate: 'desc' }
    });
    
    console.log('\n🔍 ข้อมูลล่าสุด 10 รายการ:');
    latest.forEach((item, index) => {
      console.log(`${index + 1}. ${item.myobNumber} - ${item.partName} (รับ: ${item.receivedQty}) - ${item.receivedDate.toLocaleDateString('th-TH')}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreFullData();
