@echo off
chcp 65001 >nul
color 0C
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              🗑️ ลบไฟล์ซ้ำ 🗑️                             ║
echo ║            ลบไฟล์ที่ซ้ำกันและไฟล์เก่า                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 📍 ไปที่โฟลเดอร์ Backup...
cd /d "D:\stock-backups"

echo 📊 ตรวจสอบไฟล์ JSON...
dir /b *.json | find /c ".json"
echo ไฟล์ JSON ทั้งหมด

echo.
echo 🗑️ ลบไฟล์ JSON เก่า (เก็บแค่ 2 ไฟล์ล่าสุด)...
for /f "skip=2 delims=" %%i in ('dir /b /o-d *.json 2^>nul') do (
    echo ลบ: %%i
    del "%%i"
)

echo.
echo 📍 ไปที่โฟลเดอร์ Excel...
cd excel

echo 📊 ตรวจสอบไฟล์ Excel...
dir /b *.xlsx *.csv | find /c "."
echo ไฟล์ Excel ทั้งหมด

echo.
echo 🗑️ ลบไฟล์ Excel เก่า (เก็บแค่ 2 ไฟล์ล่าสุดของแต่ละประเภท)...

:: ลบไฟล์ .xlsx เก่า
for /f "skip=2 delims=" %%i in ('dir /b /o-d *.xlsx 2^>nul') do (
    echo ลบ Excel: %%i
    del "%%i"
)

:: ลบไฟล์ .csv เก่า
for /f "skip=2 delims=" %%i in ('dir /b /o-d *.csv 2^>nul') do (
    echo ลบ CSV: %%i
    del "%%i"
)

echo.
echo 🧹 ลบไฟล์ทดสอบและไฟล์ขยะ...
if exist "*test*" del "*test*"
if exist "*temp*" del "*temp*"
if exist "*.tmp" del "*.tmp"

echo.
echo 📝 เปลี่ยนชื่อไฟล์ที่เหลือให้เข้าใจง่าย...

:: หาไฟล์ Excel ล่าสุด
for /f "delims=" %%i in ('dir /b /o-d *.xlsx 2^>nul') do (
    if not exist "📊 รายงานสต็อก.xlsx" (
        copy "%%i" "📊 รายงานสต็อก.xlsx" >nul
        echo ✅ สร้าง: 📊 รายงานสต็อก.xlsx
    )
    goto :next_csv
)

:next_csv
:: หาไฟล์ CSV ล่าสุด
for /f "delims=" %%i in ('dir /b /o-d *.csv 2^>nul') do (
    if not exist "📋 FIFO-รายงาน.csv" (
        copy "%%i" "📋 FIFO-รายงาน.csv" >nul
        echo ✅ สร้าง: 📋 FIFO-รายงาน.csv
    )
    goto :done
)

:done
cd ..

echo.
echo ✅ ลบไฟล์ซ้ำเสร็จแล้ว!
echo.
echo 📊 ไฟล์ที่เหลือ:
echo 📁 JSON Backups:
dir /b *.json 2>nul
echo.
echo 📁 Excel Files:
dir /b excel\*.xlsx excel\*.csv 2>nul
echo.
echo 🎯 ไฟล์หลักที่ใช้งาน:
echo    📊 รายงานสต็อก.xlsx
echo    📋 FIFO-รายงาน.csv
echo.

pause
