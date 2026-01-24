require('dotenv').config({path: '.env'});
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function verifyAllData() {
  try {
    console.log('🔍 ตรวจสอบข้อมูลทั้งหมดใน Supabase...');
    
    // 1. นับข้อมูลใน Supabase
    const supabaseCount = await prisma.stockItem.count();
    console.log(`📊 ข้อมูลใน Supabase: ${supabaseCount} รายการ`);
    
    // 2. อ่านไฟล์ backup ต้นทาง
    console.log('📖 อ่านไฟล์ backup ต้นทาง...');
    const backupFile = 'D:\\stock-backups\\stock-backup-2026-01-20T07-21-58-221Z.json';
    const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    console.log(`📁 ข้อมูลในไฟล์ backup: ${data.data.length} รายการ`);
    
    // 3. เปรียบเทียบ
    console.log('\n📋 สรุปการเปรียบเทียบ:');
    console.log(`- ไฟล์ backup (ต้นทาง): ${data.data.length} รายการ`);
    console.log(`- Supabase (ปลายทาง): ${supabaseCount} รายการ`);
    
    if (supabaseCount === data.data.length) {
      console.log('\n✅ ข้อมูลอัปโหลดครบ 100%!');
    } else if (supabaseCount > data.data.length) {
      console.log('\n⚠️ ข้อมูลใน Supabaseมีมากกว่าไฟล์ backup');
    } else {
      const missing = data.data.length - supabaseCount;
      console.log(`\n❌ ข้อมูลยังไม่ครบ! ขาดอีก ${missing} รายการ`);
    }
    
    // 4. ตรวจสอบข้อมูลตัวอย่าง
    console.log('\n📝 ตรวจสอบข้อมูลตัวอย่าง (5 รายการแรก):');
    
    for (let i = 0; i < Math.min(5, data.data.length); i++) {
      const backupItem = data.data[i];
      const supabaseItem = await prisma.stockItem.findFirst({
        where: {
          partNumber: backupItem.partNumber,
          poNumber: backupItem.poNumber,
          receivedDate: new Date(backupItem.receivedDate)
        }
      });
      
      if (supabaseItem) {
        console.log(`✅ ${i+1}. ${backupItem.partNumber} - ${backupItem.partName} (พบใน Supabase)`);
      } else {
        console.log(`❌ ${i+1}. ${backupItem.partNumber} - ${backupItem.partName} (ไม่พบใน Supabase)`);
      }
    }
    
    // 5. สรุปข้อมูลสำคัญ
    console.log('\n📈 สรุปข้อมูลสำคัญ:');
    console.log(`- จำนวน Part Number ที่แตกต่างกันใน Supabase: ${await prisma.stockItem.groupBy({by: ['partNumber']}).then(g => g.length)}`);
    console.log(`- จำนวน PO ที่แตกต่างกัน: ${await prisma.stockItem.groupBy({by: ['poNumber']}).then(g => g.length)}`);
    
    // 6. ตรวจสอบว่ามีข้อมูลจากไฟล์ backup อื่นไหม
    const backupDir = 'D:\\stock-backups';
    const backupFiles = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        size: fs.statSync(path.join(backupDir, f)).size
      }))
      .sort((a, b) => b.size - a.size);
    
    console.log('\n📁 ไฟล์ backup ทั้งหมด:');
    backupFiles.forEach((file, i) => {
      console.log(`  ${i+1}. ${file.name} (${(file.size/1024).toFixed(2)} KB)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllData();
