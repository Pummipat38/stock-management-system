@echo off
title Stock Management System
color 0A
cls

echo ===============================================
chcp 65001 >nul
color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║            🚀 เริ่มระบบแบบง่าย (ไม่ซับซ้อน) 🚀            ║
echo ║                 กลับไปแบบเดิมที่ทำงานได้                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "D:\stock-management-system"

echo 📍 ตำแหน่งปัจจุบัน: %CD%
echo.

echo 🔧 ตรวจสอบ dependencies...
call npm install --silent

echo.
echo 🗄️ ตรวจสอบฐานข้อมูล...
call npx prisma generate --silent
call npx prisma db push --silent

echo.
echo 🚀 เริ่มเซิร์ฟเวอร์...
echo ✅ ระบบพร้อมใช้งาน!
echo 🌐 เปิดเบราว์เซอร์ไปที่: http://localhost:3000
echo.

call npm run dev wait 10 seconds then go to: http://localhost:3000
echo.

npm run dev
