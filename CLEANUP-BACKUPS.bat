@echo off
chcp 65001 >nul
color 0E
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              🧹 ทำความสะอาด Backup Files 🧹               ║
echo ║                 ลบไฟล์เก่าและไฟล์ซ้ำ                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "D:\stock-backups"

echo 📊 ตรวจสอบไฟล์ปัจจุบัน...
dir /b *.json | find /c ".json" > temp_count.txt
set /p json_count=<temp_count.txt
del temp_count.txt
echo พบไฟล์ JSON: %json_count% ไฟล์

echo.
echo 🗑️ ลบไฟล์เก่า (เก็บแค่ 5 ไฟล์ล่าสุด)...

:: เก็บแค่ไฟล์ล่าสุด 5 ไฟล์
for /f "skip=5 delims=" %%i in ('dir /b /o-d *.json 2^>nul') do (
    echo ลบ: %%i
    del "%%i"
)

echo.
echo 🧹 ลบไฟล์ทดสอบ...
if exist "test-backup*" del "test-backup*"
if exist "*test*" del "*test*"

echo.
echo 📁 ทำความสะอาดโฟลเดอร์ excel...
cd excel 2>nul
if exist "*test*" del "*test*"
for /f "skip=5 delims=" %%i in ('dir /b /o-d *.csv 2^>nul') do (
    echo ลบ CSV: %%i
    del "%%i"
)
for /f "skip=5 delims=" %%i in ('dir /b /o-d *.xlsx 2^>nul') do (
    echo ลบ Excel: %%i
    del "%%i"
)

cd ..

echo.
echo ✅ ทำความสะอาดเสร็จแล้ว!
echo 📊 ไฟล์ที่เหลือ:
dir /b *.json | find /c ".json"
echo.

pause
