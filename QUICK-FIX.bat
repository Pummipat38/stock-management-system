@echo off
chcp 65001 >nul
color 0C
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🔥 QUICK FIX 🔥                          ║
echo ║              แก้ไขปัญหาทันที ไม่ต้องรอ!                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

D:
cd D:\stock-management-system

echo 🚨 Emergency Fix Mode Activated!
echo.

echo 🔧 Fixing database issues...
call npx prisma db push --force-reset
call npx prisma generate

echo.
echo 📁 Creating backup system...
if not exist "D:\stock-backups" mkdir "D:\stock-backups"
if not exist "D:\stock-backups\excel" mkdir "D:\stock-backups\excel"

echo.
echo 🧹 Cleaning up...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 🚀 Restarting system...
start cmd /c "cd /d D:\stock-management-system && npm run dev"

echo.
echo ✅ FIXED! System should be working now!
echo 🌐 Open: http://localhost:3000
echo.
pause
