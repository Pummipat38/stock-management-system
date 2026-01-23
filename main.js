const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // สร้างหน้าต่างแอปพลิเคชัน
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // ไอคอนแอป
    title: 'Stock Management System',
    show: false, // ไม่แสดงจนกว่าจะโหลดเสร็จ
  });

  // โหลด URL ของแอป
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // แสดงหน้าต่างเมื่อโหลดเสร็จ
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // เปิด DevTools ในโหมด development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
    
    // Debug: ตรวจสอบ URL ที่โหลด
    console.log('Loading URL:', startUrl);
  });

  // ปิดแอปเมื่อปิดหน้าต่างหลัก
  mainWindow.on('closed', () => {
    app.quit();
  });
}

// เมื่อ Electron พร้อมใช้งาน
app.whenReady().then(createWindow);

// ปิดแอปเมื่อปิดหน้าต่างทั้งหมด (ยกเว้น macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// สร้างหน้าต่างใหม่เมื่อคลิกไอคอนใน dock (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
