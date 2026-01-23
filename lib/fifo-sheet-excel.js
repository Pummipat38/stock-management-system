const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class FIFOSheetExcelManager {
  constructor() {
    this.backupDir = 'D:\\stock-backups';
    this.excelDir = 'D:\\stock-backups\\excel';
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.backupDir, this.excelDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async createFIFOExcelByParts() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // ดึงข้อมูลทั้งหมด
      const allData = await prisma.stockItem.findMany({
        orderBy: [
          { myobNumber: 'asc' },
          { partNumber: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      // จัดกลุ่มตาม Part
      const partGroups = this.groupByPart(allData);
      
      // สร้างไฟล์ Excel แบบหลาย Sheet
      const excelContent = this.createMultiSheetCSV(partGroups);
      
      const fileName = `FIFO-Parts-${timestamp}.csv`;
      const filePath = path.join(this.excelDir, fileName);
      
      fs.writeFileSync(filePath, excelContent, 'utf8');

      // สร้างไฟล์แยกตาม Part (ถ้าต้องการ)
      const separateFiles = await this.createSeparatePartFiles(partGroups, timestamp);

      console.log(`✅ สร้าง FIFO Excel สำเร็จ!`);
      console.log(`📊 จำนวน Parts: ${Object.keys(partGroups).length}`);
      console.log(`📄 ไฟล์หลัก: ${fileName}`);
      
      return {
        success: true,
        fileName,
        filePath,
        partCount: Object.keys(partGroups).length,
        separateFiles
      };

    } catch (error) {
      console.error('❌ สร้าง FIFO Excel ล้มเหลว:', error);
      return { success: false, error: error.message };
    }
  }

  groupByPart(data) {
    const groups = {};
    
    data.forEach(item => {
      const partKey = `${item.myobNumber}-${item.partNumber}`;
      
      if (!groups[partKey]) {
        groups[partKey] = {
          info: {
            myobNumber: item.myobNumber,
            partNumber: item.partNumber,
            partName: item.partName,
            model: item.model
          },
          transactions: []
        };
      }
      
      groups[partKey].transactions.push(item);
    });
    
    return groups;
  }

  createMultiSheetCSV(partGroups) {
    let csvContent = '';
    
    // สร้าง Index Sheet
    csvContent += '=== INDEX - รายการ Parts ทั้งหมด ===\n';
    csvContent += '"Part Number","MYOB Number","Part Name","Total Received","Total Issued","Balance","Sheet Name"\n';
    
    Object.entries(partGroups).forEach(([partKey, partData]) => {
      const summary = this.calculatePartSummary(partData.transactions);
      csvContent += `"${partData.info.partNumber}","${partData.info.myobNumber}","${partData.info.partName}","${summary.totalReceived}","${summary.totalIssued}","${summary.balance}","Sheet_${partKey.replace(/[^a-zA-Z0-9]/g, '_')}"\n`;
    });
    
    csvContent += '\n\n';
    
    // สร้าง Sheet แต่ละ Part
    Object.entries(partGroups).forEach(([partKey, partData]) => {
      csvContent += this.createPartSheet(partKey, partData);
      csvContent += '\n\n';
    });
    
    return '\ufeff' + csvContent;
  }

  createPartSheet(partKey, partData) {
    const info = partData.info;
    let sheetContent = '';
    
    // Header ของ Sheet
    sheetContent += `=== SHEET: ${partKey} ===\n`;
    sheetContent += `"Part Information"\n`;
    sheetContent += `"MYOB Number:","${info.myobNumber}"\n`;
    sheetContent += `"Part Number:","${info.partNumber}"\n`;
    sheetContent += `"Part Name:","${info.partName}"\n`;
    sheetContent += `"Model:","${info.model}"\n`;
    sheetContent += '\n';
    
    // FIFO Transaction Table
    sheetContent += '"Date","Time","Transaction","PO/Invoice","Qty","Running Balance","Supplier/Customer","Remarks"\n';
    
    let runningBalance = 0;
    const fifoTransactions = this.calculateFIFO(partData.transactions);
    
    fifoTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('th-TH');
      const time = new Date(transaction.date).toLocaleTimeString('th-TH');
      const qty = transaction.type === 'IN' ? transaction.qty : -transaction.qty;
      runningBalance += qty;
      
      sheetContent += `"${date}","${time}","${transaction.description}","${transaction.reference}","${qty}","${runningBalance}","${transaction.party}","${transaction.remarks}"\n`;
    });
    
    // Summary
    const summary = this.calculatePartSummary(partData.transactions);
    sheetContent += '\n';
    sheetContent += '"=== SUMMARY ==="\n';
    sheetContent += `"Total Received:","${summary.totalReceived}"\n`;
    sheetContent += `"Total Issued:","${summary.totalIssued}"\n`;
    sheetContent += `"Current Balance:","${summary.balance}"\n`;
    sheetContent += `"Last Activity:","${new Date(summary.lastActivity).toLocaleString('th-TH')}"\n`;
    
    return sheetContent;
  }

  calculateFIFO(transactions) {
    const fifoTransactions = [];
    
    transactions.forEach(item => {
      // รายการรับเข้า
      if (item.receivedQty && item.receivedQty > 0) {
        fifoTransactions.push({
          date: item.receivedDate || item.createdAt,
          type: 'IN',
          qty: item.receivedQty,
          description: `รับเข้า ${item.receivedQty} ชิ้น`,
          reference: item.poNumber || '',
          party: item.supplier || '',
          remarks: item.remarks || ''
        });
      }
      
      // รายการจ่ายออก
      if (item.issuedQty && item.issuedQty > 0) {
        fifoTransactions.push({
          date: item.issueDate || item.createdAt,
          type: 'OUT',
          qty: item.issuedQty,
          description: `จ่ายออก ${item.issuedQty} ชิ้น`,
          reference: item.invoiceNumber || item.withdrawalNumber || '',
          party: item.customer || '',
          remarks: item.remarks || item.event || ''
        });
      }
    });
    
    // เรียงตามวันที่
    return fifoTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  calculatePartSummary(transactions) {
    let totalReceived = 0;
    let totalIssued = 0;
    let lastActivity = null;
    
    transactions.forEach(item => {
      totalReceived += item.receivedQty || 0;
      totalIssued += item.issuedQty || 0;
      
      const itemDate = new Date(item.updatedAt);
      if (!lastActivity || itemDate > lastActivity) {
        lastActivity = itemDate;
      }
    });
    
    return {
      totalReceived,
      totalIssued,
      balance: totalReceived - totalIssued,
      lastActivity: lastActivity || new Date()
    };
  }

  async createSeparatePartFiles(partGroups, timestamp) {
    const separateFiles = [];
    
    for (const [partKey, partData] of Object.entries(partGroups)) {
      const fileName = `${partKey}-FIFO-${timestamp}.csv`;
      const filePath = path.join(this.excelDir, fileName);
      
      const partContent = this.createPartSheet(partKey, partData);
      fs.writeFileSync(filePath, '\ufeff' + partContent, 'utf8');
      
      separateFiles.push({
        partKey,
        fileName,
        filePath,
        partName: partData.info.partName
      });
    }
    
    return separateFiles;
  }

  // สร้างไฟล์ Excel จริง (ถ้าต้องการ .xlsx)
  async createRealExcelFile(partGroups, timestamp) {
    // ใช้ library เช่น exceljs หรือ xlsx
    // สำหรับตอนนี้ใช้ CSV ก่อน
    console.log('📊 Excel file creation - ใช้ CSV format ก่อน');
    return this.createFIFOExcelByParts();
  }
}

module.exports = FIFOSheetExcelManager;
