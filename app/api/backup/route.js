import { NextResponse } from 'next/server';
const BackupManager = require('../../../lib/backup');

const backupManager = new BackupManager();

export async function POST(request) {
  try {
    const { action, fileName } = await request.json();

    switch (action) {
      case 'create':
        const result = await backupManager.createBackup('manual');
        return NextResponse.json(result);

      case 'restore':
        if (!fileName) {
          return NextResponse.json({ 
            success: false, 
            error: 'ต้องระบุชื่อไฟล์ backup' 
          });
        }
        const restoreResult = await backupManager.restoreFromBackup(fileName);
        return NextResponse.json(restoreResult);

      case 'list':
        const backups = backupManager.listBackups();
        return NextResponse.json({ success: true, backups });

      case 'export':
        const exportResult = await backupManager.excelManager.exportCurrentDataToExcel();
        return NextResponse.json(exportResult);

      case 'export-excel':
        const excelResult = await backupManager.excelManager.exportCurrentDataToExcel();
        return NextResponse.json(excelResult);

      case 'export-fifo':
        const fifoResult = await backupManager.excelManager.fifoManager.createFIFOExcelByParts();
        return NextResponse.json(fifoResult);

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Action ไม่ถูกต้อง' 
        });
    }
  } catch (error) {
    console.error('Backup API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    });
  }
}

export async function GET() {
  try {
    // ไม่สร้าง backup อัตโนมัติ แค่แสดงรายการ
    const backups = backupManager.listBackups();
    return NextResponse.json({ success: true, backups });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'ไม่สามารถโหลดรายการ backup ได้' 
    });
  }
}
