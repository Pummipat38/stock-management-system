// การตั้งค่า Backup System
const BACKUP_CONFIG = {
  // จำนวนวันที่เก็บไฟล์ backup (ปรับได้)
  MAX_BACKUP_DAYS: 30,
  
  // ช่วงเวลา Auto Backup (นาที)
  AUTO_BACKUP_INTERVAL: 30,
  
  // ขนาดไฟล์สูงสุดต่อ backup (MB)
  MAX_BACKUP_SIZE: 1000, // 1 GB
  
  // จำนวนรายการสูงสุดต่อ batch
  BATCH_SIZE: 100,
  
  // โฟลเดอร์ backup หลัก
  PRIMARY_BACKUP_DIR: 'D:\\stock-backups',
  
  // โฟลเดอร์ backup สำรอง (ถ้ามี USB/External Drive)
  SECONDARY_BACKUP_DIRS: [
    'E:\\stock-backups',  // USB Drive
    'F:\\stock-backups',  // External Drive
    '\\\\network\\backups\\stock' // Network Drive
  ],
  
  // การบีบอัดไฟล์
  COMPRESSION: {
    enabled: true,
    level: 6 // 1-9 (9 = บีบอัดสูงสุด)
  },
  
  // การเข้ารหัส
  ENCRYPTION: {
    enabled: false, // เปิดได้ถ้าต้องการ
    algorithm: 'aes-256-gcm'
  },
  
  // การแจ้งเตือน
  NOTIFICATIONS: {
    backup_success: true,
    backup_failed: true,
    low_disk_space: true,
    old_backups_cleaned: false
  },
  
  // ขีดจำกัดพื้นที่
  DISK_SPACE: {
    // เตือนเมื่อพื้นที่เหลือน้อยกว่า (GB)
    warning_threshold: 5,
    
    // หยุด backup เมื่อพื้นที่เหลือน้อยกว่า (GB)
    critical_threshold: 2,
    
    // ลบ backup เก่าอัตโนมัติเมื่อพื้นที่เต็ม
    auto_cleanup: true
  }
};

module.exports = BACKUP_CONFIG;
