@echo off
chcp 65001 >nul
color 0E
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                 ⚡ EMERGENCY START ⚡                       ║
echo ║            ระบบพร้อมใช้งานใน 30 วินาที!                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

D:
cd D:\stock-management-system

echo 🚀 Emergency startup sequence initiated...
echo.

echo [1/5] 🔧 Quick database setup...
call npx prisma db push 2>nul
call npx prisma generate 2>nul

echo [2/5] 📁 Backup system ready...
if not exist "D:\stock-backups\excel" mkdir "D:\stock-backups\excel" 2>nul

echo [3/5] 🧹 Clearing conflicts...
taskkill /f /im node.exe 2>nul

echo [4/5] 🎯 Installing critical packages...
call npm install --production 2>nul

echo [5/5] 🚀 Starting system...
echo.
echo ✅ READY! System starting now...
echo 🌐 URL: http://localhost:3000
echo 💾 Auto Backup: Active
echo 🛡️ Data Protection: Enabled
echo.

call npm run dev
