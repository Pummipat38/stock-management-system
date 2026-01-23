@echo off
chcp 65001 >nul
color 0B
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║            🖥️ อัพเดทไอคอน Desktop 🖥️                      ║
echo ║          แก้ไข URL จาก 3000 เป็น 3001                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔍 กำลังค้นหาไอคอน Desktop เก่า...

:: ลบไอคอนเก่าถ้ามี
if exist "%USERPROFILE%\Desktop\Stock Management System.url" (
    del "%USERPROFILE%\Desktop\Stock Management System.url"
    echo ✅ ลบไอคอนเก่าแล้ว
)

if exist "%PUBLIC%\Desktop\Stock Management System.url" (
    del "%PUBLIC%\Desktop\Stock Management System.url"
    echo ✅ ลบไอคอนเก่าจาก Public Desktop แล้ว
)

echo 🆕 สร้างไอคอนใหม่ (Port 3001)...

:: สร้างไอคอน URL ใหม่
echo [InternetShortcut] > "%USERPROFILE%\Desktop\📦 Stock Management System.url"
echo URL=http://localhost:3001 >> "%USERPROFILE%\Desktop\📦 Stock Management System.url"
echo IconFile=%%SystemRoot%%\System32\shell32.dll >> "%USERPROFILE%\Desktop\📦 Stock Management System.url"
echo IconIndex=4 >> "%USERPROFILE%\Desktop\📦 Stock Management System.url"

echo 📋 สร้างไอคอนหน้าต่างๆ...

:: สร้างไอคอนหน้า Receiving
echo [InternetShortcut] > "%USERPROFILE%\Desktop\📥 รับเข้าสินค้า.url"
echo URL=http://localhost:3001/receiving >> "%USERPROFILE%\Desktop\📥 รับเข้าสินค้า.url"
echo IconFile=%%SystemRoot%%\System32\shell32.dll >> "%USERPROFILE%\Desktop\📥 รับเข้าสินค้า.url"
echo IconIndex=4 >> "%USERPROFILE%\Desktop\📥 รับเข้าสินค้า.url"

:: สร้างไอคอนหน้า Issuing
echo [InternetShortcut] > "%USERPROFILE%\Desktop\📤 จ่ายออกสินค้า.url"
echo URL=http://localhost:3001/issuing >> "%USERPROFILE%\Desktop\📤 จ่ายออกสินค้า.url"
echo IconFile=%%SystemRoot%%\System32\shell32.dll >> "%USERPROFILE%\Desktop\📤 จ่ายออกสินค้า.url"
echo IconIndex=4 >> "%USERPROFILE%\Desktop\📤 จ่ายออกสินค้า.url"

:: สร้างไอคอนหน้า Backup
echo [InternetShortcut] > "%USERPROFILE%\Desktop\💾 Backup System.url"
echo URL=http://localhost:3001/backup >> "%USERPROFILE%\Desktop\💾 Backup System.url"
echo IconFile=%%SystemRoot%%\System32\shell32.dll >> "%USERPROFILE%\Desktop\💾 Backup System.url"
echo IconIndex=4 >> "%USERPROFILE%\Desktop\💾 Backup System.url"

echo.
echo ✅ สร้างไอคอนใหม่เสร็จแล้ว!
echo 🖥️ ไอคอนใหม่บน Desktop:
echo    📦 Stock Management System (หน้าหลัก)
echo    📥 รับเข้าสินค้า (Receiving)
echo    📤 จ่ายออกสินค้า (Issuing)  
echo    💾 Backup System (Backup)
echo.
echo 🎯 ทุกไอคอนใช้ Port 3001 แล้ว!
echo.

pause
