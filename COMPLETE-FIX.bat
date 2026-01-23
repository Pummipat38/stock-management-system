@echo off
chcp 65001 >nul
color 0C
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              🔧 แก้ไขปัญหาสมบูรณ์ 🔧                      ║
echo ║            ลบทุกอย่างแล้วสร้างใหม่หมด                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

D:
cd D:\stock-management-system

echo 🛑 หยุดกระบวนการทั้งหมด...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 🗑️ ลบไฟล์ cache และ build...
if exist ".next" rmdir /s /q ".next"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist ".turbo" rmdir /s /q ".turbo"

echo 📦 ติดตั้ง dependencies ใหม่...
call npm install --force

echo 🔨 Build ระบบใหม่...
call npm run build

echo 🗄️ Setup ฐานข้อมูล...
call npx prisma generate
call npx prisma db push

echo 🔧 สร้างข้อมูลทดสอบ...
call node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    const existing = await prisma.stockItem.findFirst();
    if (!existing) {
      await prisma.stockItem.create({
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
      console.log('✅ ข้อมูลทดสอบถูกสร้าง');
    } else {
      console.log('✅ ข้อมูลมีอยู่แล้ว');
    }
  } catch (error) {
    console.log('⚠️ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
"

echo.
echo ✅ แก้ไขเสร็จสิ้น!
echo 🚀 เริ่มระบบ...
echo 🌐 URL: http://localhost:3000
echo.

call npm run dev
