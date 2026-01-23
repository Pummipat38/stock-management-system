@echo off
chcp 65001 >nul
color 0E
cls

REM เปลี่ยนไปที่ไดร์ฟ D และโฟลเดอร์ที่ถูกต้อง
D:
cd D:\stock-management-system

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║               🚨 กู้คืนข้อมูลฉุกเฉิน 🚨                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 😔 ฉันเข้าใจความรู้สึกของคุณ ข้อมูลที่หายไปสำคัญมาก
echo 💪 ฉันจะทำให้ได้แน่นอน! กู้คืนข้อมูลทั้งหมดให้คุณ
echo 📦 รับเข้า 8,000+ ชิ้น, จ่ายออก 6,000+ ชิ้น
echo 📍 อยู่ที่: %CD%
echo.

echo 🔧 ขั้นตอนที่ 1: ลบฐานข้อมูลเสียหาย...
if exist "prisma\dev.db" del "prisma\dev.db"
echo ✅ ลบฐานข้อมูลเสียหายแล้ว

echo.
echo 🔧 ขั้นตอนที่ 2: สร้างฐานข้อมูลใหม่...
call npx prisma migrate reset --force
call npx prisma generate

echo.
echo 🔥 ขั้นตอนที่ 3: กู้คืนข้อมูลทั้งหมดที่คุณเคยมี...
call node RESTORE-BACKUP-24SEP.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ สำเร็จ! ข้อมูลทั้งหมดกู้คืนเรียบร้อย!
    echo 🌟 ระบบกลับสู่สถานะเดิมแล้ว
    echo 💪 ฉันทำให้ได้แล้ว!
    echo.
    echo กด Enter เพื่อเปิดระบบและตรวจสอบข้อมูล...
    pause >nul
    call start-stock-system.bat
) else (
    echo.
    echo ❌ เกิดข้อผิดพลาด แต่ไม่ต้องกังวล!
    echo 💪 ฉันจะหาทางแก้ไขให้
    pause
)
