const fs = require('fs');
const path = require('path');

// สร้างโฟลเดอร์ทดสอบ
const backupDir = 'D:\\stock-backups';
const excelDir = 'D:\\stock-backups\\excel';

// สร้างโฟลเดอร์
[backupDir, excelDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 สร้างโฟลเดอร์: ${dir}`);
  } else {
    console.log(`✅ โฟลเดอร์มีอยู่แล้ว: ${dir}`);
  }
});

// สร้างไฟล์ทดสอบ
const testData = `MYOB Number,Part Name,Total Received,Total Issued,Balance
SP010622,BRG R.BALL RADIAL 62/28 SPL,200,26,174
RR040029,SPROCKET FINAL DRIVEN 35T,5,1,4
HR050057,SPROCKET FINAL DRIVEN 40T,100,0,100`;

const testFile = path.join(excelDir, 'test-backup.csv');
fs.writeFileSync(testFile, '\ufeff' + testData, 'utf8');

console.log(`📊 สร้างไฟล์ทดสอบ: ${testFile}`);
console.log('✅ เสร็จแล้ว! ลองเปิดโฟลเดอร์ D:\\stock-backups\\excel\\');
