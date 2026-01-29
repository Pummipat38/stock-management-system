const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const ExcelBackupManager = require('./excel-backup');

const prisma = new PrismaClient();

class BackupManager {
  constructor() {
    this.backupDir = 'D:\\stock-backups';
    this.maxBackups = 5; // เก็บ 5 ไฟล์
    this.autoBackupInterval = 2 * 60 * 60 * 1000; // 2 ชั่วโมง
    
    // สร้าง Excel Backup Manager
    this.excelManager = new ExcelBackupManager();
    
    // สร้างโฟลเดอร์ backup ถ้ายังไม่มี
    this.ensureBackupDir();
    
    const enableDailyBackup = String(process.env.ENABLE_DAILY_BACKUP || '').toLowerCase() === 'true';
    if (enableDailyBackup) {
      this.startDailyBackup();
    }
  }

  ensureBackupDir() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
        console.log(`📁 สร้างโฟลเดอร์ backup: ${this.backupDir}`);
      }
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      console.error('⚠️ Cannot ensure backup directory:', message);
    }
  }

  async createBackup(type = 'auto') {
    try {
      // สร้าง Dual Backup (JSON + Excel)
      const dualResult = await this.excelManager.createDualBackup();
      
      if (dualResult.success) {
        console.log(`✅ Dual Backup สำเร็จ!`);
        console.log(`📄 JSON: ${dualResult.json.recordCount} รายการ`);
        console.log(`📊 Excel: ${dualResult.excel.recordCount} รายการ`);
        
        // ลบ backup เก่าที่เกิน limit
        this.cleanOldBackups();

        return {
          success: true,
          fileName: dualResult.json.fileName,
          excelFileName: dualResult.excel.fileName,
          path: dualResult.json.filePath,
          excelPath: dualResult.excel.filePath,
          recordCount: dualResult.json.recordCount,
          format: 'JSON + Excel'
        };
      } else {
        throw new Error(dualResult.error);
      }

    } catch (error) {
      console.error('❌ Dual Backup ล้มเหลว:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async restoreFromBackup(backupFileName) {
    try {
      const backupPath = path.join(this.backupDir, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`ไม่พบไฟล์ backup: ${backupFileName}`);
      }

      // อ่านข้อมูล backup
      const backupContent = fs.readFileSync(backupPath, 'utf8');
      const backupData = JSON.parse(backupContent);

      console.log(`🔄 กำลังกู้คืนข้อมูลจาก: ${backupFileName}`);
      console.log(`📅 สร้างเมื่อ: ${backupData.metadata.createdAt}`);
      console.log(`📊 จำนวนข้อมูล: ${backupData.metadata.totalRecords} รายการ`);

      // ลบข้อมูลปัจจุบันทั้งหมด
      await prisma.stockItem.deleteMany({});
      console.log('🗑️ ลบข้อมูลเก่าเรียบร้อย');

      // กู้คืนข้อมูล
      if (backupData.data && backupData.data.length > 0) {
        // แบ่งเป็นชุดๆ เพื่อป้องกัน timeout
        const batchSize = 100;
        for (let i = 0; i < backupData.data.length; i += batchSize) {
          const batch = backupData.data.slice(i, i + batchSize);
          await prisma.stockItem.createMany({
            data: batch.map(item => ({
              ...item,
              id: undefined, // ให้ database สร้าง ID ใหม่
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt)
            }))
          });
          console.log(`✅ กู้คืนข้อมูลแล้ว ${i + batch.length}/${backupData.data.length} รายการ`);
        }
      }

      console.log('🎉 กู้คืนข้อมูลสำเร็จ!');
      
      return {
        success: true,
        recordCount: backupData.data.length,
        metadata: backupData.metadata
      };

    } catch (error) {
      console.error('❌ กู้คืนข้อมูลล้มเหลว:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('stock-backup-') && file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          
          // อ่าน metadata จากไฟล์
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            
            return {
              fileName: file,
              size: stats.size,
              createdAt: stats.mtime,
              recordCount: data.metadata?.totalRecords || 0,
              totalReceived: data.metadata?.totalReceived || 0,
              totalIssued: data.metadata?.totalIssued || 0,
              type: data.metadata?.type || 'unknown'
            };
          } catch {
            return {
              fileName: file,
              size: stats.size,
              createdAt: stats.mtime,
              recordCount: 0,
              error: 'ไม่สามารถอ่านไฟล์ได้'
            };
          }
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return files;
    } catch (error) {
      console.error('❌ ไม่สามารถอ่านรายการ backup:', error);
      return [];
    }
  }

  cleanOldBackups() {
    try {
      const backups = this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        
        toDelete.forEach(backup => {
          const filePath = path.join(this.backupDir, backup.fileName);
          fs.unlinkSync(filePath);
          console.log(`🗑️ ลบ backup เก่า: ${backup.fileName}`);
        });
      }
    } catch (error) {
      console.error('❌ ไม่สามารถลบ backup เก่า:', error);
    }
  }

  startDailyBackup() {
    console.log('📅 เริ่ม Daily Backup (วันละครั้ง)');
    
    // คำนวณเวลาถึงเที่ยงคืน
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Backup ครั้งแรกเมื่อถึงเที่ยงคืน
    setTimeout(() => {
      this.createBackup('daily');
      
      // จากนั้น backup ทุก 24 ชั่วโมง
      setInterval(async () => {
        console.log('📅 Daily Backup กำลังทำงาน...');
        await this.createBackup('daily');
      }, 24 * 60 * 60 * 1000); // 24 ชั่วโมง
      
    }, msUntilMidnight);
    
    console.log(`⏰ Daily Backup จะเริ่มในอีก ${Math.round(msUntilMidnight / 1000 / 60)} นาที`);
  }

  startAutoBackup() {
    console.log(`🔄 เริ่ม Auto Backup ทุก ${this.autoBackupInterval / 60000} นาที`);
    
    setInterval(async () => {
      console.log('⏰ Auto Backup กำลังทำงาน...');
      await this.createBackup('auto');
    }, this.autoBackupInterval);

    // สร้าง backup ครั้งแรกทันที
    setTimeout(() => {
      this.createBackup('startup');
    }, 5000); // รอ 5 วินาทีหลังเริ่มระบบ
  }

  async exportToExcel(filePath) {
    try {
      const allData = await prisma.stockItem.findMany({
        orderBy: { createdAt: 'asc' }
      });

      // สร้างข้อมูลสำหรับ Excel
      const excelData = allData.map(item => ({
        'MYOB Number': item.myobNumber,
        'Model': item.model,
        'Part Name': item.partName,
        'Part Number': item.partNumber,
        'Revision': item.revision,
        'PO Number': item.poNumber,
        'Received Qty': item.receivedQty || 0,
        'Received Date': item.receivedDate ? new Date(item.receivedDate).toLocaleDateString('th-TH') : '',
        'Supplier': item.supplier || '',
        'Issued Qty': item.issuedQty || 0,
        'Issue Date': item.issueDate ? new Date(item.issueDate).toLocaleDateString('th-TH') : '',
        'Customer': item.customer || '',
        'Invoice Number': item.invoiceNumber || '',
        'Event': item.event || '',
        'Withdrawal Number': item.withdrawalNumber || '',
        'Remarks': item.remarks || '',
        'Created At': new Date(item.createdAt).toLocaleString('th-TH'),
        'Updated At': new Date(item.updatedAt).toLocaleString('th-TH')
      }));

      // บันทึกเป็น JSON (สำหรับตอนนี้ จะเพิ่ม Excel library ทีหลัง)
      fs.writeFileSync(filePath, JSON.stringify(excelData, null, 2), 'utf8');

      return {
        success: true,
        recordCount: excelData.length,
        filePath: filePath
      };

    } catch (error) {
      console.error('❌ Export ล้มเหลว:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = BackupManager;
