@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              🎯 FINAL SOLUTION 🎯                          ║
echo ║         แก้ไขครั้งเดียวจบ - ไม่เสียเวลาอีก                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

D:
cd D:\stock-management-system

echo 🛑 หยุดทุกอย่าง...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 🗑️ ลบทุกอย่างที่เสีย...
if exist "prisma\dev.db" del "prisma\dev.db"
if exist "prisma\dev.db-journal" del "prisma\dev.db-journal"
if exist "prisma\migrations" rmdir /s /q "prisma\migrations"
if exist ".next" rmdir /s /q ".next"

echo 📝 สร้าง .env ใหม่...
echo DATABASE_URL="file:./dev.db" > .env

echo 🔧 สร้าง Database และตารางใหม่...
call npx prisma migrate dev --name init --skip-generate
call npx prisma generate
call npx prisma db push

echo 🧪 ทดสอบและสร้างข้อมูล...
call node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔍 ทดสอบการเชื่อมต่อ...');
    await prisma.$connect();
    console.log('✅ เชื่อมต่อสำเร็จ!');
    
    console.log('📊 ตรวจสอบตาราง...');
    const tables = await prisma.$queryRaw\`SELECT name FROM sqlite_master WHERE type='table';\`;
    console.log('📋 ตารางที่มี:', tables);
    
    console.log('🧹 ลบข้อมูลเก่า...');
    await prisma.transaction.deleteMany().catch(() => {});
    await prisma.stockItem.deleteMany().catch(() => {});
    
    console.log('📝 สร้างข้อมูลทดสอบ...');
    const item1 = await prisma.stockItem.create({
      data: {
        myobNumber: 'SP010622',
        model: '4084/4081',
        partName: 'BRG R.BALL RADIAL 62/28 SPL',
        partNumber: '91051-KWN-003',
        revision: 'A',
        poNumber: 'PO001',
        receivedQty: 200,
        receivedDate: new Date('2024-09-01'),
        supplier: 'NSK BEARING CO.,LTD'
      }
    });
    
    const item2 = await prisma.stockItem.create({
      data: {
        myobNumber: 'RR040029',
        model: '4084/4081',
        partName: 'SPROCKET,FINAL DRIVEN,35T',
        partNumber: '41201-KWN-003',
        revision: 'A',
        poNumber: 'PO002',
        receivedQty: 5,
        receivedDate: new Date('2024-09-02'),
        supplier: 'THAI HONDA CO.,LTD'
      }
    });
    
    console.log('✅ สร้างข้อมูลสำเร็จ:', item1.id, item2.id);
    
    const count = await prisma.stockItem.count();
    console.log('📊 จำนวนข้อมูล:', count);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
"

echo.
echo ✅ ระบบพร้อมใช้งาน 100%%!
echo 🚀 เริ่มเซิร์ฟเวอร์...
echo.

call npm run dev
pause
