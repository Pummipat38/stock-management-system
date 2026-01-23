@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              📊 แก้ไข Excel Export 📊                     ║
echo ║            ติดตั้ง Excel library และแก้ไข Error           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

D:
cd D:\stock-management-system

echo 🛑 หยุดเซิร์ฟเวอร์...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 📦 ติดตั้ง Excel libraries...
call npm install xlsx exceljs --save

echo 🔧 ตรวจสอบ dependencies...
call npm list xlsx
call npm list exceljs

echo 🧪 ทดสอบ Excel export...
call node -e "
try {
  const XLSX = require('xlsx');
  const ExcelJS = require('exceljs');
  console.log('✅ XLSX version:', XLSX.version);
  console.log('✅ ExcelJS loaded successfully');
  
  // ทดสอบสร้างไฟล์ Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([{test: 'data'}]);
  XLSX.utils.book_append_sheet(wb, ws, 'Test');
  console.log('✅ Excel creation test passed');
  
} catch (error) {
  console.error('❌ Excel test failed:', error.message);
}
"

echo.
echo ✅ Excel libraries พร้อมใช้งาน!
echo 🚀 เริ่มเซิร์ฟเวอร์...
echo.

call npm run dev
