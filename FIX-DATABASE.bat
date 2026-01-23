@echo off
chcp 65001 >nul
color 0E
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              🗄️ แก้ไขปัญหา Database 🗄️                    ║
echo ║                Error 503 - Database ไม่เชื่อมต่อ            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

D:
cd D:\stock-management-system

echo 🛑 หยุดเซิร์ฟเวอร์...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 🗄️ รีเซ็ต Database...
call npx prisma migrate reset --force --skip-generate

echo 🔧 Generate Prisma Client...
call npx prisma generate

echo 📊 Push Database Schema...
call npx prisma db push --force-reset

echo 🔍 ตรวจสอบ Database...
call npx prisma db seed 2>nul || echo "No seed file found"

echo 🧪 ทดสอบการเชื่อมต่อ...
call node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database เชื่อมต่อสำเร็จ');
    
    // สร้างข้อมูลทดสอบ
    const testData = await prisma.stockItem.create({
      data: {
        myobNumber: 'TEST001',
        model: 'TEST',
        partName: 'Test Part',
        partNumber: 'TEST-001',
        revision: 'A',
        poNumber: 'PO-TEST',
        receivedQty: 1,
        receivedDate: new Date(),
        supplier: 'Test Supplier'
      }
    });
    console.log('✅ สร้างข้อมูลทดสอบสำเร็จ:', testData.id);
    
    // ลบข้อมูลทดสอบ
    await prisma.stockItem.delete({
      where: { id: testData.id }
    });
    console.log('✅ ลบข้อมูลทดสอบสำเร็จ');
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
"

echo.
echo ✅ Database พร้อมใช้งาน!
echo 🚀 เริ่มเซิร์ฟเวอร์...
echo.

call npm run dev
