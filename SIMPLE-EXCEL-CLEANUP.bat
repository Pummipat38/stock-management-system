@echo off
chcp 65001 >nul
color 0B
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              📊 ทำความสะอาด Excel 📊                      ║
echo ║                    แบบง่ายๆ                               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 📍 ไปที่โฟลเดอร์ Excel...
cd /d "D:\stock-backups\excel"

echo 📊 ตรวจสอบไฟล์...
dir *.xlsx *.csv

echo.
echo 🗑️ ลบไฟล์เก่า...
for /f "skip=3 delims=" %%i in ('dir /b /o-d *.xlsx 2^>nul') do del "%%i"
for /f "skip=3 delims=" %%i in ('dir /b /o-d *.csv 2^>nul') do del "%%i"

echo.
echo 📝 สร้างไฟล์หลัก...
for /f "tokens=*" %%i in ('dir /b /o-d *.xlsx 2^>nul ^| findstr /n "^" ^| findstr "^1:"') do (
    set "file=%%i"
    setlocal enabledelayedexpansion
    set "file=!file:~2!"
    if exist "!file!" copy "!file!" "📊 รายงานสต็อกล่าสุด.xlsx" >nul
    endlocal
)

for /f "tokens=*" %%i in ('dir /b /o-d *.csv 2^>nul ^| findstr /n "^" ^| findstr "^1:"') do (
    set "file=%%i"
    setlocal enabledelayedexpansion
    set "file=!file:~2!"
    if exist "!file!" copy "!file!" "📋 FIFO-ล่าสุด.csv" >nul
    endlocal
)

echo.
echo ✅ เสร็จแล้ว!
echo 📊 ไฟล์หลัก:
echo    📊 รายงานสต็อกล่าสุด.xlsx
echo    📋 FIFO-ล่าสุด.csv
echo.

dir "📊*" "📋*" 2>nul

echo.
echo กด Enter เพื่อปิด...
pause >nul
exit
