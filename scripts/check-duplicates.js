require('dotenv').config({path: '.env'});
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูลซ้ำ...');
    
    // นับรายการทั้งหมด
    const totalCount = await prisma.stockItem.count();
    console.log('📊 จำนวนรายการทั้งหมด:', totalCount);
    
    // ตรวจสอบซ้ำจาก partNumber + poNumber + receivedDate
    const duplicates = await prisma.$queryRaw`
      SELECT 
        "partNumber" as "partNumber",
        "poNumber" as "poNumber",
        "receivedDate" as "receivedDate",
        COUNT(*) as count
      FROM "StockItem" 
      GROUP BY "partNumber", "poNumber", "receivedDate" 
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `;
    
    if (duplicates.length > 0) {
      console.log('\n⚠️ พบข้อมูลซ้ำ (partNumber + poNumber + receivedDate):');
      duplicates.forEach((dup, i) => {
        console.log(`  ${i+1}. Part: ${dup.partNumber} | PO: ${dup.poNumber || 'ไม่มี'} | วันที่: ${dup.receivedDate?.toISOString().split('T')[0]} | ซ้ำ: ${dup.count} รายการ`);
      });
    } else {
      console.log('\n✅ ไม่พบข้อมูลซ้ำ (partNumber + poNumber + receivedDate)');
    }
    
    // ตรวจสอบ partNumber ซ้ำ
    const partDuplicates = await prisma.$queryRaw`
      SELECT 
        "partNumber" as "partNumber",
        COUNT(*) as count
      FROM "StockItem" 
      GROUP BY "partNumber" 
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `;
    
    if (partDuplicates.length > 0) {
      console.log('\n🔄 Part Number ที่ปรากฏหลายครั้ง:');
      partDuplicates.forEach((dup, i) => {
        console.log(`  ${i+1}. ${dup.partNumber} - ${dup.count} รายการ`);
      });
    } else {
      console.log('\n✅ ไม่มี Part Number ซ้ำ');
    }
    
    // ตรวจสอบ ID ซ้ำ (ไม่ควรเกิด)
    const idDuplicates = await prisma.$queryRaw`
      SELECT 
        id,
        COUNT(*) as count
      FROM "StockItem" 
      GROUP BY id 
      HAVING COUNT(*) > 1
    `;
    
    if (idDuplicates.length > 0) {
      console.log('\n❌ พบ ID ซ้ำ (ไม่ควรเกิด):');
      idDuplicates.forEach((dup, i) => {
        console.log(`  ${i+1}. ID: ${dup.id} - ซ้ำ: ${dup.count} รายการ`);
      });
    }
    
    // สรุป
    console.log('\n📋 สรุปการตรวจสอบ:');
    console.log(`- จำนวนรายการทั้งหมด: ${totalCount}`);
    console.log(`- กลุ่มข้อมูลซ้ำ: ${duplicates.length} กลุ่ม`);
    console.log(`- Part Number ซ้ำ: ${partDuplicates.length} รายการ`);
    console.log(`- ID ซ้ำ: ${idDuplicates.length} รายการ`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();
