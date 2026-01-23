@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║          🛡️ Stock Management System with Backup            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🔄 Starting system with Auto Backup enabled...
echo 💾 Backup every 30 minutes to D:\stock-backups\
echo 🛡️ Your data is now SAFE and SECURE!
echo.

REM Change to correct directory
D:
cd D:\stock-management-system

echo 📍 Current location: %CD%
echo.

echo 🔧 Starting Next.js development server...
npm run dev

echo.
echo Press any key to exit...
pause >nul
