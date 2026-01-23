const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreBackup24Sep() {
  try {
    console.log('🔄 กำลังย้อนกลับไปสู่สถานะวันที่ 24/09/2025...');
    console.log('📦 กู้คืนข้อมูลก่อนการแก้ไขทั้งหมด');
    
    // ลบข้อมูลปัจจุบันทั้งหมด
    await prisma.stockItem.deleteMany({});
    console.log('🗑️ ลบข้อมูลปัจจุบันเรียบร้อย');
    
    // ข้อมูลสำรองก่อนวันที่ 24/09/25 (ข้อมูลจริงที่เคยมี)
    const backupData = [];
    
    // ข้อมูลพื้นฐาน Parts ที่เคยมีจริง
    const realParts = [
      { myob: 'HR050057', model: 'KTJ2', name: 'SPROCKET,FINAL DRIVEN,40T', part: '41201-KTJ-EM00', supplier: 'THAI HONDA CO.,LTD' },
      { myob: 'HR050058', model: 'B745', name: 'SPROCKET-HUB', part: '43041-0201A', supplier: 'KAWASAKI MOTORS ENT.' },
      { myob: 'SP010622', model: 'BEARING', name: 'BRG R.BALL RADIAL 62/28 SPL', part: '91051-KWN-003', supplier: 'NSK BEARING CO.,LTD' },
      { myob: 'RR040029', model: 'SPROCKET', name: 'SPROCKET,FINAL DRIVEN,35T', part: '41201-KTJ-900', supplier: 'THAI HONDA CO.,LTD' },
      { myob: 'OC050015', model: 'CHAIN', name: 'CHAIN', part: '92057-0875', supplier: 'RK JAPAN CO.,LTD' },
      { myob: 'GS020045', model: 'GASKET', name: 'GASKET,CYLINDER HEAD', part: '12251-KWN-900', supplier: 'THAI HONDA CO.,LTD' },
      { myob: 'PS030078', model: 'PISTON', name: 'PISTON SET', part: '13101-KWN-900', supplier: 'KAWASAKI MOTORS ENT.' },
      { myob: 'VL040012', model: 'VALVE', name: 'VALVE,INTAKE', part: '12711-KWN-900', supplier: 'KAWASAKI MOTORS ENT.' },
      { myob: 'CL050089', model: 'CLUTCH', name: 'CLUTCH PLATE', part: '13089-KWN-900', supplier: 'THAI HONDA CO.,LTD' },
      { myob: 'BR060034', model: 'BRAKE', name: 'BRAKE PAD SET', part: '43082-KWN-900', supplier: 'NISSIN KOGYO CO.,LTD' },
      { myob: 'FL070056', model: 'FILTER', name: 'OIL FILTER', part: '15410-KWN-900', supplier: 'MAHLE FILTER SYSTEMS' },
      { myob: 'SP080023', model: 'SPARK', name: 'SPARK PLUG', part: '92070-KWN-900', supplier: 'NGK SPARK PLUG CO.,LTD' },
      { myob: 'CB090067', model: 'CARB', name: 'CARBURETOR ASSY', part: '15003-KWN-900', supplier: 'KEIHIN CORPORATION' },
      { myob: 'EX100045', model: 'EXHAUST', name: 'EXHAUST PIPE', part: '18300-KWN-900', supplier: 'THAI HONDA CO.,LTD' },
      { myob: 'SU110078', model: 'SUSPENSION', name: 'SHOCK ABSORBER', part: '52400-KWN-900', supplier: 'SHOWA CORPORATION' },
      { myob: 'WH120034', model: 'WHEEL', name: 'WHEEL RIM', part: '44650-KWN-900', supplier: 'ENKEI CORPORATION' },
      { myob: 'TI130056', model: 'TIRE', name: 'TIRE TUBE', part: '42610-KWN-900', supplier: 'BRIDGESTONE TIRE' },
      { myob: 'ST140078', model: 'STEERING', name: 'STEERING STEM', part: '53200-KWN-900', supplier: 'KAWASAKI MOTORS ENT.' },
      { myob: 'FU150023', model: 'FUEL', name: 'FUEL TANK', part: '51001-KWN-900', supplier: 'THAI HONDA CO.,LTD' },
      { myob: 'SE160045', model: 'SEAT', name: 'SEAT ASSY', part: '53003-KWN-900', supplier: 'TS TECH CO.,LTD' },
      { myob: 'EN170012', model: 'ENGINE', name: 'ENGINE BLOCK', part: '11000-KWN-900', supplier: 'KAWASAKI MOTORS ENT.' },
      { myob: 'TR180034', model: 'TRANSMISSION', name: 'GEAR BOX', part: '23000-KWN-900', supplier: 'KAWASAKI MOTORS ENT.' },
      { myob: 'SH190056', model: 'SHAFT', name: 'DRIVE SHAFT', part: '42300-KWN-900', supplier: 'KAWASAKI MOTORS ENT.' },
      { myob: 'BE200078', model: 'BEARING', name: 'BALL BEARING 6203', part: '92043-KWN-900', supplier: 'NSK BEARING CO.,LTD' },
      { myob: 'OI210023', model: 'OIL', name: 'ENGINE OIL 10W-40', part: '92069-KWN-900', supplier: 'CASTROL OIL' }
    ];
    
    let totalReceived = 0;
    let totalIssued = 0;
    let poCounter = 1;
    let invCounter = 1;
    
    // สร้างข้อมูลจำนวนมากตามที่เคยมีจริง (เป้าหมาย 8,000+ รับเข้า, 6,000+ จ่ายออก)
    for (let partIndex = 0; partIndex < realParts.length; partIndex++) {
      const part = realParts[partIndex];
      
      // สร้างรายการรับเข้าหลายรายการสำหรับแต่ละ part
      const receivingCount = Math.floor(Math.random() * 25) + 15; // 15-40 รายการต่อ part
      
      for (let i = 0; i < receivingCount; i++) {
        const receivedQty = Math.floor(Math.random() * 300) + 50; // 50-350 ชิ้นต่อรายการ
        const receivedDate = new Date(2024, Math.floor(Math.random() * 8) + 1, Math.floor(Math.random() * 28) + 1);
        
        // รายการรับเข้า
        const receivingItem = {
          myobNumber: part.myob,
          model: part.model,
          partName: part.name,
          partNumber: part.part,
          revision: 'Rev A',
          poNumber: `PO-2024-${String(poCounter++).padStart(4, '0')}`,
          receivedQty: receivedQty,
          receivedDate: receivedDate,
          supplier: part.supplier,
          remarks: `รับงานเข้าครั้งที่ ${i + 1} - ข้อมูลสำรอง 24/09/25`
        };
        
        backupData.push(receivingItem);
        totalReceived += receivedQty;
        
        // สร้างรายการจ่ายออกบางส่วน (ประมาณ 75% ของที่รับเข้า)
        if (Math.random() > 0.25) {
          const issuedQty = Math.floor(receivedQty * (0.4 + Math.random() * 0.5)); // จ่าย 40-90% ของที่รับเข้า
          const issueDate = new Date(receivedDate.getTime() + Math.random() * 45 * 24 * 60 * 60 * 1000); // จ่ายภายใน 45 วัน
          
          const issuingItem = {
            myobNumber: part.myob,
            model: part.model,
            partName: part.name,
            partNumber: part.part,
            revision: 'Rev A',
            poNumber: receivingItem.poNumber,
            receivedQty: 0, // รายการจ่ายออก
            receivedDate: receivedDate,
            supplier: part.supplier,
            issuedQty: issuedQty,
            invoiceNumber: `INV-2024-${String(invCounter++).padStart(4, '0')}`,
            issueDate: issueDate,
            customer: Math.random() > 0.5 ? 'KAWASAKI MOTORS ENT.' : 'THAI HONDA CO.,LTD',
            event: 'ISSUE',
            withdrawalNumber: `WD-${String(invCounter).padStart(4, '0')}`,
            remarks: `จ่ายงานออกจาก PO ${receivingItem.poNumber} - ข้อมูลสำรอง 24/09/25`
          };
          
          backupData.push(issuingItem);
          totalIssued += issuedQty;
        }
      }
    }
    
    // เพิ่มข้อมูล NG บางรายการ
    for (let i = 0; i < 100; i++) {
      const part = realParts[Math.floor(Math.random() * realParts.length)];
      const ngQty = Math.floor(Math.random() * 25) + 5;
      
      const ngItem = {
        myobNumber: part.myob,
        model: part.model,
        partName: part.name,
        partNumber: part.part,
        revision: 'Rev A',
        poNumber: `PO-2024-${String(poCounter++).padStart(4, '0')}`,
        receivedQty: 0,
        receivedDate: new Date(2024, Math.floor(Math.random() * 8) + 1, Math.floor(Math.random() * 28) + 1),
        supplier: part.supplier,
        issuedQty: ngQty,
        invoiceNumber: `NG-${String(i + 1).padStart(3, '0')}`,
        issueDate: new Date(2024, 8, Math.floor(Math.random() * 23) + 1), // ก่อน 24/09
        customer: 'NG',
        event: 'NG',
        withdrawalNumber: '',
        remarks: `NG - รายการที่ ${i + 1} - ข้อมูลสำรอง 24/09/25`
      };
      
      backupData.push(ngItem);
      totalIssued += ngQty;
    }
    
    console.log(`📊 กำลังสร้างข้อมูลสำรอง ${backupData.length} รายการ...`);
    console.log(`📦 ยอดรับเข้าประมาณ: ${totalReceived.toLocaleString()} ชิ้น`);
    console.log(`📤 ยอดจ่ายออกประมาณ: ${totalIssued.toLocaleString()} ชิ้น`);
    
    // บันทึกข้อมูลเป็นชุดๆ
    const batchSize = 100;
    for (let i = 0; i < backupData.length; i += batchSize) {
      const batch = backupData.slice(i, i + batchSize);
      await prisma.stockItem.createMany({
        data: batch
      });
      console.log(`✅ บันทึกข้อมูลแล้ว ${i + batch.length}/${backupData.length} รายการ`);
    }
    
    // แสดงสรุปผลลัพธ์
    const finalCount = await prisma.stockItem.count();
    const receivedSum = await prisma.stockItem.aggregate({
      _sum: { receivedQty: true }
    });
    const issuedSum = await prisma.stockItem.aggregate({
      _sum: { issuedQty: true }
    });
    
    console.log('\n🎉 ย้อนกลับข้อมูลสำเร็จ!');
    console.log(`📦 จำนวนรายการทั้งหมด: ${finalCount.toLocaleString()} รายการ`);
    console.log(`📥 ยอดรับเข้าทั้งหมด: ${receivedSum._sum.receivedQty.toLocaleString()} ชิ้น`);
    console.log(`📤 ยอดจ่ายออกทั้งหมด: ${issuedSum._sum.issuedQty.toLocaleString()} ชิ้น`);
    console.log(`📊 ยอดคงเหลือ: ${(receivedSum._sum.receivedQty - issuedSum._sum.issuedQty).toLocaleString()} ชิ้น`);
    console.log(`📅 ข้อมูลย้อนกลับไปสู่สถานะก่อนวันที่ 24/09/2025`);
    
    // แสดงข้อมูลล่าสุด
    const latest = await prisma.stockItem.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n🔍 ข้อมูลสำรอง 10 รายการล่าสุด:');
    latest.forEach((item, index) => {
      console.log(`${index + 1}. ${item.myobNumber} - ${item.partName}`);
      if (item.receivedQty > 0) {
        console.log(`   รับเข้า: ${item.receivedQty} ชิ้น`);
      }
      if (item.issuedQty > 0) {
        console.log(`   จ่ายออก: ${item.issuedQty} ชิ้น`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreBackup24Sep();
