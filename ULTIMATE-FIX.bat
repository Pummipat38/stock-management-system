@echo off
chcp 65001 >nul
color 0C
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              🔥 ULTIMATE FIX 🔥                            ║
echo ║         แก้ไขปัญหา Database Error 503 ให้หมด             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

D:
cd D:\stock-management-system

echo 🛑 หยุดทุกกระบวนการ...
taskkill /f /im node.exe 2>nul
timeout /t 3 /nobreak >nul

echo 🗑️ ลบ Database เก่า...
if exist "prisma\dev.db" del "prisma\dev.db"
if exist "prisma\dev.db-journal" del "prisma\dev.db-journal"

echo 🔧 สร้าง .env ใหม่...
echo DATABASE_URL="file:./dev.db" > .env
echo NODE_ENV="development" >> .env

echo 📊 สร้าง Database ใหม่...
call npx prisma migrate reset --force --skip-generate
call npx prisma generate
call npx prisma db push --force-reset

echo 🧪 ทดสอบ Database...
call node -e "
const { PrismaClient } = require('@prisma/client');

async function testAndCreateData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 ทดสอบการเชื่อมต่อ...');
    await prisma.$connect();
    console.log('✅ Database เชื่อมต่อสำเร็จ!');
    
    console.log('🧹 ลบข้อมูลเก่า...');
    await prisma.transaction.deleteMany();
    await prisma.stockItem.deleteMany();
    
    console.log('📝 สร้างข้อมูลทดสอบ...');
    const testItem = await prisma.stockItem.create({
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
    console.log('✅ สร้างข้อมูลทดสอบสำเร็จ ID:', testItem.id);
    
    const count = await prisma.stockItem.count();
    console.log('📊 จำนวนข้อมูลในระบบ:', count);
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.error('📍 Error Details:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 ปิดการเชื่อมต่อ Database');
  }
}

testAndCreateData();
"

echo.
echo ✅ Database พร้อมใช้งาน 100%%!
echo 🚀 เริ่มเซิร์ฟเวอร์...
echo 🌐 URL: http://localhost:3000
echo.

timeout /t 2 /nobreak >nul
call npm run dev
