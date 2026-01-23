const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreData() {
  try {
    console.log('🔄 กำลังสร้างข้อมูลใหม่...');
    
    // สร้างข้อมูลตัวอย่างจำนวนมาก
    const sampleData = [];
    
    // สร้างข้อมูลพื้นฐาน
    const baseItems = [
      {
        myobNumber: 'HR050057',
        model: 'KTJ2',
        partName: 'SPROCKET,FINAL DRIVEN,40T',
        partNumber: '41201-KTJ-EM00',
        supplier: 'THAI HONDA CO.,LTD'
      },
      {
        myobNumber: 'HR050058',
        model: 'B745',
        partName: 'SPROCKET-HUB',
        partNumber: '43041-0201A',
        supplier: 'KAWASAKI MOTORS ENT.'
      },
      {
        myobNumber: 'OC050015',
        model: 'CHAIN',
        partName: 'CHAIN',
        partNumber: '92057-0875',
        supplier: 'RK JAPAN CO.,LTD'
      }
    ];
    
    // สร้างข้อมูลหลายรายการ
    for (let i = 0; i < baseItems.length; i++) {
      const base = baseItems[i];
      
      // สร้างหลาย PO สำหรับแต่ละ part
      for (let j = 1; j <= 10; j++) {
        sampleData.push({
          myobNumber: base.myobNumber,
          model: base.model,
          partName: base.partName,
          partNumber: base.partNumber,
          revision: 'Rev A',
          poNumber: `PO-2024-${String(i * 10 + j).padStart(3, '0')}`,
          receivedQty: Math.floor(Math.random() * 100) + 20,
          receivedDate: new Date(`2024-0${(i % 3) + 1}-${String(j).padStart(2, '0')}`),
          supplier: base.supplier,
          issuedQty: Math.random() > 0.5 ? Math.floor(Math.random() * 20) : null,
          invoiceNumber: Math.random() > 0.5 ? `INV-${String(i * 10 + j).padStart(3, '0')}` : null,
          issueDate: Math.random() > 0.5 ? new Date(`2024-0${(i % 3) + 1}-${String(j + 5).padStart(2, '0')}`) : null,
          customer: Math.random() > 0.5 ? 'KAWASAKI MOTORS ENT.' : null,
          event: Math.random() > 0.5 ? 'ISSUE' : null,
          withdrawalNumber: Math.random() > 0.5 ? `WD-${String(i * 10 + j).padStart(3, '0')}` : null,
          remarks: `รายการที่ ${i * 10 + j}`
        });
      }
    }
    
    // เพิ่มข้อมูล NG
    for (let i = 0; i < 5; i++) {
      const base = baseItems[i % baseItems.length];
      sampleData.push({
        myobNumber: base.myobNumber,
        model: base.model,
        partName: base.partName,
        partNumber: base.partNumber,
        revision: 'Rev A',
        poNumber: `PO-2024-${String(100 + i).padStart(3, '0')}`,
        receivedQty: 0,
        receivedDate: new Date('2024-09-01'),
        supplier: base.supplier,
        issuedQty: Math.floor(Math.random() * 10) + 1,
        invoiceNumber: `NG-${String(i + 1).padStart(3, '0')}`,
        issueDate: new Date('2024-09-15'),
        customer: 'NG',
        event: 'NG',
        withdrawalNumber: '',
        remarks: `NG - รายการที่ ${i + 1}`
      });
    }
    
    // บันทึกข้อมูลลงฐานข้อมูล
    await prisma.stockItem.createMany({
      data: sampleData
    });
    
    console.log(`✅ สร้างข้อมูลสำเร็จ ${sampleData.length} รายการ!`);
    
    const count = await prisma.stockItem.count();
    console.log(`📦 มีข้อมูลทั้งหมด ${count} รายการ`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();
