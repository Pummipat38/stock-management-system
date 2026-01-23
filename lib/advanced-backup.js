const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

class AdvancedBackupManager {
  constructor() {
    this.prisma = new PrismaClient();
    this.backupDir = 'D:\\stock-backups';
    this.archiveDir = 'D:\\stock-archives'; // สำหรับข้อมูลเก่า
    this.maxRecordsPerFile = 100000; // 100K records per file
    this.maxActiveRecords = 1000000; // 1M records ในระบบหลัก
  }

  // แบ่งข้อมูลตามช่วงเวลา
  async createPartitionedBackup() {
    try {
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      // ข้อมูลปีปัจจุบัน (Active)
      const activeData = await this.prisma.stockItem.findMany({
        where: {
          createdAt: {
            gte: oneYearAgo
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // ข้อมูลเก่า (Archive)
      const archiveData = await this.prisma.stockItem.findMany({
        where: {
          createdAt: {
            lt: oneYearAgo
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`📊 ข้อมูลปัจจุบัน: ${activeData.length.toLocaleString()} รายการ`);
      console.log(`📦 ข้อมูลเก่า: ${archiveData.length.toLocaleString()} รายการ`);

      // สำรองข้อมูลปัจจุบัน
      if (activeData.length > 0) {
        await this.savePartitionedData(activeData, 'active', this.backupDir);
      }

      // Archive ข้อมูลเก่า
      if (archiveData.length > 0) {
        await this.savePartitionedData(archiveData, 'archive', this.archiveDir);
        
        // ลบข้อมูลเก่าออกจากระบบหลัก (ถ้าต้องการ)
        if (activeData.length > this.maxActiveRecords) {
          console.log('🗂️ ย้ายข้อมูลเก่าไป Archive...');
          // await this.prisma.stockItem.deleteMany({
          //   where: { createdAt: { lt: oneYearAgo } }
          // });
        }
      }

      return {
        success: true,
        activeRecords: activeData.length,
        archivedRecords: archiveData.length
      };

    } catch (error) {
      console.error('❌ Partitioned Backup ล้มเหลว:', error);
      return { success: false, error: error.message };
    }
  }

  // บันทึกข้อมูลแบบแบ่งไฟล์
  async savePartitionedData(data, type, baseDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // สร้างโฟลเดอร์
    const typeDir = path.join(baseDir, type);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }

    // แบ่งข้อมูลเป็นไฟล์ย่อย
    const chunks = this.chunkArray(data, this.maxRecordsPerFile);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const fileName = `${type}-${timestamp}-part-${i + 1}-of-${chunks.length}.json`;
      const filePath = path.join(typeDir, fileName);

      const fileData = {
        metadata: {
          type: type,
          part: i + 1,
          totalParts: chunks.length,
          recordCount: chunk.length,
          createdAt: new Date().toISOString(),
          dateRange: {
            from: chunk[chunk.length - 1]?.createdAt,
            to: chunk[0]?.createdAt
          }
        },
        data: chunk
      };

      fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
      console.log(`✅ บันทึก ${fileName}: ${chunk.length.toLocaleString()} รายการ`);
    }
  }

  // แบ่ง Array เป็นชิ้นเล็ก
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // บีบอัดไฟล์ (ถ้าต้องการ)
  async compressBackup(filePath) {
    const zlib = require('zlib');
    const compressedPath = filePath + '.gz';
    
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);
      const writeStream = fs.createWriteStream(compressedPath);
      const gzip = zlib.createGzip({ level: 9 });

      readStream
        .pipe(gzip)
        .pipe(writeStream)
        .on('finish', () => {
          // ลบไฟล์เดิม
          fs.unlinkSync(filePath);
          console.log(`🗜️ บีบอัดเสร็จ: ${path.basename(compressedPath)}`);
          resolve(compressedPath);
        })
        .on('error', reject);
    });
  }

  // สำรองไปยัง External Drive
  async backupToExternalDrive() {
    const externalDrives = ['E:', 'F:', 'G:']; // USB/External drives
    
    for (const drive of externalDrives) {
      try {
        const drivePath = path.join(drive, '\\stock-backups');
        
        // ตรวจสอบว่า drive มีอยู่
        if (fs.existsSync(drive + '\\')) {
          console.log(`💾 พบ External Drive: ${drive}`);
          
          // สร้างโฟลเดอร์
          if (!fs.existsSync(drivePath)) {
            fs.mkdirSync(drivePath, { recursive: true });
          }

          // Copy ไฟล์ backup ล่าสุด
          await this.copyLatestBackups(this.backupDir, drivePath);
          console.log(`✅ สำรองไป ${drive} เรียบร้อย`);
          
          return true;
        }
      } catch (error) {
        console.log(`⚠️ ไม่สามารถสำรองไป ${drive}: ${error.message}`);
      }
    }
    
    return false;
  }

  // Copy ไฟล์ล่าสุด
  async copyLatestBackups(sourceDir, targetDir) {
    const files = fs.readdirSync(sourceDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .slice(-10); // เอา 10 ไฟล์ล่าสุด

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      fs.copyFileSync(sourcePath, targetPath);
    }
  }

  // ตรวจสอบพื้นที่ว่าง
  checkDiskSpace() {
    const { execSync } = require('child_process');
    
    try {
      const output = execSync('dir D: /-c', { encoding: 'utf8' });
      const lines = output.split('\n');
      const lastLine = lines[lines.length - 2];
      const freeBytes = parseInt(lastLine.match(/[\d,]+/g)[1].replace(/,/g, ''));
      const freeGB = Math.round(freeBytes / (1024 * 1024 * 1024));
      
      console.log(`💽 พื้นที่ว่างไดร์ฟ D: ${freeGB} GB`);
      
      if (freeGB < 5) {
        console.log('⚠️ พื้นที่เหลือน้อย! กำลังลบ backup เก่า...');
        this.cleanupOldBackups();
      }
      
      return freeGB;
    } catch (error) {
      console.error('❌ ไม่สามารถตรวจสอบพื้นที่:', error);
      return null;
    }
  }

  // ลบ backup เก่า
  cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          mtime: fs.statSync(path.join(this.backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // เก็บ 20 ไฟล์ล่าสุด ลบที่เหลือ
      const toDelete = files.slice(20);
      
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️ ลบ backup เก่า: ${file.name}`);
      });

      console.log(`✅ ลบ backup เก่า ${toDelete.length} ไฟล์`);
    } catch (error) {
      console.error('❌ ไม่สามารถลบ backup เก่า:', error);
    }
  }
}

module.exports = AdvancedBackupManager;
