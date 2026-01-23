@echo off
chcp 65001 >nul
color 0B
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              📊 จัดระเบียบไฟล์ Excel 📊                   ║
echo ║           ลบไฟล์เก่า + เปลี่ยนชื่อให้เข้าใจง่าย            ║
echo ╚══════════════════════════════════════════════════════════════╗
echo.

cd /d "D:\stock-backups\excel"

echo 📍 ตำแหน่งปัจจุบัน: %CD%
echo.

echo 📊 ตรวจสอบไฟล์ Excel ปัจจุบัน...
dir /b *.xlsx *.csv 2>nul | find /c "." > temp_count.txt
set /p file_count=<temp_count.txt
del temp_count.txt
echo พบไฟล์ทั้งหมด: %file_count% ไฟล์

echo.
echo 🗑️ ลบไฟล์เก่า (เก็บแค่ 3 ไฟล์ล่าสุด)...

:: ลบไฟล์ Excel เก่า
for /f "skip=3 delims=" %%i in ('dir /b /o-d *.xlsx 2^>nul') do (
    echo ลบ Excel: %%i
    del "%%i"
)

:: ลบไฟล์ CSV เก่า
for /f "skip=3 delims=" %%i in ('dir /b /o-d *.csv 2^>nul') do (
    echo ลบ CSV: %%i
    del "%%i"
)

echo.
echo 📝 เปลี่ยนชื่อไฟล์ให้เข้าใจง่าย...

:: หาไฟล์ล่าสุด
for /f "delims=" %%i in ('dir /b /o-d *.xlsx 2^>nul ^| findstr /n "^" ^| findstr "^1:"') do (
    set "latest_excel=%%i"
    set "latest_excel=!latest_excel:~2!"
)

for /f "delims=" %%i in ('dir /b /o-d *.csv 2^>nul ^| findstr /n "^" ^| findstr "^1:"') do (
    set "latest_csv=%%i"
    set "latest_csv=!latest_csv:~2!"
)

:: เปลี่ยนชื่อไฟล์ล่าสุด
if defined latest_excel (
    if exist "%latest_excel%" (
        copy "%latest_excel%" "📊 Stock-Report-Latest.xlsx" >nul
        echo ✅ สร้าง: 📊 Stock-Report-Latest.xlsx
    )
)

if defined latest_csv (
    if exist "%latest_csv%" (
        copy "%latest_csv%" "📋 FIFO-Parts-Latest.csv" >nul
        echo ✅ สร้าง: 📋 FIFO-Parts-Latest.csv
    )
)

echo.
echo 📁 สร้างโฟลเดอร์จัดเก็บ...
if not exist "Archive" mkdir "Archive"
if not exist "Daily-Reports" mkdir "Daily-Reports"

echo.
echo ✅ จัดระเบียบเสร็จแล้ว!
echo.
echo 📊 ไฟล์หลักที่ใช้งาน:
echo    📊 Stock-Report-Latest.xlsx  (รายงานสต็อกล่าสุด)
echo    📋 FIFO-Parts-Latest.csv     (FIFO แยก Part ล่าสุด)
echo.
echo 📁 โฟลเดอร์:
echo    📁 Archive                   (เก็บไฟล์เก่า)
echo    📁 Daily-Reports             (รายงานประจำวัน)
echo.

dir /b *.xlsx *.csv 2>nul | find /c "."
echo ไฟล์ที่เหลือ: ไฟล์

echo.
echo กด Enter เพื่อปิด...
pause
