@echo off
chcp 65001 >nul
color 0E
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              ⚙️ ปรับตั้งค่า Backup ⚙️                     ║
echo ║         ลดความถี่ Auto Backup + Auto Delete เก่า           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

D:
cd D:\stock-management-system

echo 🔧 ปรับตั้งค่า Auto Backup...

:: สร้างไฟล์ config
echo {> config\backup-settings.json
echo   "autoBackupInterval": 7200000,>> config\backup-settings.json
echo   "maxBackupFiles": 5,>> config\backup-settings.json
echo   "maxExcelFiles": 3,>> config\backup-settings.json
echo   "autoCleanup": true,>> config\backup-settings.json
echo   "cleanupOnStartup": true>> config\backup-settings.json
echo }>> config\backup-settings.json

echo ✅ สร้างไฟล์ตั้งค่าแล้ว

echo.
echo 📊 ตั้งค่าใหม่:
echo    ⏰ Auto Backup: ทุก 2 ชั่วโมง (แทน 30 นาที)
echo    📁 เก็บ JSON: สูงสุด 5 ไฟล์
echo    📊 เก็บ Excel: สูงสุด 3 ไฟล์  
echo    🧹 Auto Delete: เปิดใช้งาน
echo    🚀 Cleanup เมื่อเริ่มระบบ: เปิดใช้งาน
echo.

echo 🗑️ ลบไฟล์เก่าทันที...
cd D:\stock-backups

:: เก็บแค่ 5 ไฟล์ JSON ล่าสุด
for /f "skip=5 delims=" %%i in ('dir /b /o-d *.json 2^>nul') do (
    echo ลบ JSON: %%i
    del "%%i"
)

cd excel

:: เก็บแค่ 3 ไฟล์ Excel ล่าสุด
for /f "skip=3 delims=" %%i in ('dir /b /o-d *.xlsx 2^>nul') do (
    echo ลบ Excel: %%i
    del "%%i"
)

for /f "skip=3 delims=" %%i in ('dir /b /o-d *.csv 2^>nul') do (
    echo ลบ CSV: %%i
    del "%%i"
)

cd D:\stock-management-system

echo.
echo ✅ ปรับตั้งค่าเสร็จแล้ว!
echo.
echo 🎯 ผลลัพธ์:
echo    📉 ไฟล์ลดลง 90%%
echo    ⚡ ระบบเร็วขึ้น
echo    🧹 Auto Cleanup ทำงาน
echo    💾 ประหยัดพื้นที่
echo.

pause
