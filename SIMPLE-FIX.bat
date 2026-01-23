@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              🔧 SIMPLE FIX 🔧                              ║
echo ║            แก้ไขแบบง่าย ไม่ซับซ้อน                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

D:
cd D:\stock-management-system

echo 📍 ตำแหน่งปัจจุบัน: %CD%
echo.

echo 🛑 หยุดกระบวนการเก่า...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 🗑️ ลบ Database เก่า...
if exist "prisma\dev.db" (
    del "prisma\dev.db"
    echo ✅ ลบ dev.db แล้ว
)

echo 📝 สร้าง .env...
echo DATABASE_URL="file:./dev.db" > .env
echo ✅ สร้าง .env แล้ว

echo 🔧 Setup Database...
echo กำลัง generate Prisma...
call npx prisma generate
echo กำลัง push database...
call npx prisma db push --force-reset

echo 🧪 ทดสอบ Database...
call node -e "console.log('Testing...'); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.stockItem.create({data:{myobNumber:'TEST',model:'TEST',partName:'TEST',partNumber:'TEST',revision:'A',poNumber:'TEST',receivedQty:1,receivedDate:new Date(),supplier:'TEST'}}).then(r => console.log('✅ Database OK:', r.id)).catch(e => console.log('❌ Error:', e.message)).finally(() => prisma.$disconnect());"

echo.
echo ✅ เสร็จแล้ว! กำลังเริ่มเซิร์ฟเวอร์...
echo 🌐 URL: http://localhost:3000
echo.

call npm run dev

echo.
echo กด Enter เพื่อปิด...
pause
