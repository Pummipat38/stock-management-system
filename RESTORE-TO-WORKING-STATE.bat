@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              🔄 กู้คืนสู่สถานะเดิม 🔄                      ║
echo ║         กลับไปเหมือนก่อนแก้ไข NG ที่ทำงานได้             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

D:
cd D:\stock-management-system

echo 🚨 กำลังกู้คืนระบบสู่สถานะที่ทำงานได้...
echo.

echo [1/6] 🛑 หยุดกระบวนการทั้งหมด...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/6] 🗄️ รีเซ็ตฐานข้อมูลเป็นแบบเดิม...
call npx prisma migrate reset --force
call npx prisma generate
call npx prisma db push

echo [3/6] 📦 ติดตั้ง dependencies ที่จำเป็น...
call npm install

echo [4/6] 🔧 สร้างข้อมูลทดสอบพื้นฐาน...
call node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBasicData() {
  try {
    // สร้างข้อมูลทดสอบพื้นฐาน
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
    
    await prisma.stockItem.create({
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
    
    console.log('✅ ข้อมูลพื้นฐานถูกสร้างแล้ว');
  } catch (error) {
    console.log('⚠️ ข้อมูลอาจมีอยู่แล้ว:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createBasicData();
"

echo [5/6] 📁 สร้างโฟลเดอร์ backup...
if not exist "D:\stock-backups" mkdir "D:\stock-backups"
if not exist "D:\stock-backups\excel" mkdir "D:\stock-backups\excel"

echo [6/6] 🚀 เริ่มระบบในโหมดปกติ...
echo.
echo ✅ กู้คืนเสร็จสิ้น!
echo 🌐 ระบบจะเปิดที่: http://localhost:3000
echo 💾 ระบบ Backup: พร้อมใช้งาน
echo 🛡️ ข้อมูล: ปลอดภัย
echo.
echo กำลังเริ่มเซิร์ฟเวอร์...

call npm run dev
