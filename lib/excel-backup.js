const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const FIFOSheetExcelManager = require('./fifo-sheet-excel');

const prisma = new PrismaClient();

class ExcelBackupManager {
  constructor() {
    this.backupDir = 'D:\\stock-backups';
    this.excelDir = 'D:\\stock-backups\\excel';
    this.fifoManager = new FIFOSheetExcelManager();
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.backupDir, this.excelDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async createDualBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // 1. สร้าง JSON Backup (เดิม)
      const jsonResult = await this.createJSONBackup(timestamp);
      
      // 2. สร้าง Excel Backup (ใหม่)
      const excelResult = await this.createExcelBackup(timestamp);
      
      console.log('🎉 Dual Backup สำเร็จ!');
      console.log(`📄 JSON: ${jsonResult.fileName}`);
      console.log(`📊 Excel: ${excelResult.fileName}`);
      
      return {
        success: true,
        json: jsonResult,
        excel: excelResult
      };

    } catch (error) {
      console.error('❌ Dual Backup ล้มเหลว:', error);
      return { success: false, error: error.message };
    }
  }

  async createJSONBackup(timestamp) {
    const allData = await prisma.stockItem.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const backupData = {
      metadata: {
        version: '2.0',
        createdAt: new Date().toISOString(),
        type: 'dual_backup',
        totalRecords: allData.length,
        totalReceived: allData.reduce((sum, item) => sum + (item.receivedQty || 0), 0),
        totalIssued: allData.reduce((sum, item) => sum + (item.issuedQty || 0), 0),
        format: 'JSON'
      },
      data: allData
    };

    const fileName = `stock-backup-${timestamp}.json`;
    const filePath = path.join(this.backupDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
    
    return {
      fileName,
      filePath,
      recordCount: allData.length,
      format: 'JSON'
    };
  }

  async createExcelBackup(timestamp) {
    const allData = await prisma.stockItem.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // สร้างข้อมูลสำหรับ Excel (CSV format)
    const csvData = this.convertToCSV(allData);
    
    const fileName = `stock-backup-${timestamp}.csv`;
    const filePath = path.join(this.excelDir, fileName);
    
    fs.writeFileSync(filePath, csvData, 'utf8');
    
    // สร้าง Excel Summary
    const summaryData = this.createSummaryCSV(allData);
    const summaryFileName = `stock-summary-${timestamp}.csv`;
    const summaryPath = path.join(this.excelDir, summaryFileName);
    
    fs.writeFileSync(summaryPath, summaryData, 'utf8');
    
    // สร้าง FIFO Excel รวมทุก Part ในไฟล์เดียว (ใหม่!)
    const fifoResult = await this.createCombinedFIFOExcel(timestamp);
    
    return {
      fileName,
      filePath,
      summaryFileName,
      summaryPath,
      fifoFileName: fifoResult.success ? fifoResult.fileName : null,
      fifoFilePath: fifoResult.success ? fifoResult.filePath : null,
      recordCount: allData.length,
      format: 'CSV/Excel + FIFO Sheets'
    };
  }

  convertToCSV(data) {
    if (data.length === 0) return '';

    // Header
    const headers = [
      'ID',
      'MYOB Number',
      'Model',
      'Part Name',
      'Part Number',
      'Revision',
      'PO Number',
      'Received Qty',
      'Received Date',
      'Supplier',
      'Issued Qty',
      'Issue Date',
      'Customer',
      'Invoice Number',
      'Event',
      'Withdrawal Number',
      'Remarks',
      'Created At',
      'Updated At'
    ];

    // Data rows
    const rows = data.map(item => [
      item.id || '',
      item.myobNumber || '',
      item.model || '',
      item.partName || '',
      item.partNumber || '',
      item.revision || '',
      item.poNumber || '',
      item.receivedQty || 0,
      item.receivedDate ? new Date(item.receivedDate).toLocaleDateString('th-TH') : '',
      item.supplier || '',
      item.issuedQty || 0,
      item.issueDate ? new Date(item.issueDate).toLocaleDateString('th-TH') : '',
      item.customer || '',
      item.invoiceNumber || '',
      item.event || '',
      item.withdrawalNumber || '',
      item.remarks || '',
      new Date(item.createdAt).toLocaleString('th-TH'),
      new Date(item.updatedAt).toLocaleString('th-TH')
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Add BOM for Thai characters
    return '\ufeff' + csvContent;
  }

  createSummaryCSV(data) {
    // สร้างสรุปตาม Part Number
    const summary = new Map();
    
    data.forEach(item => {
      const key = `${item.myobNumber}-${item.partNumber}`;
      
      if (!summary.has(key)) {
        summary.set(key, {
          myobNumber: item.myobNumber,
          partName: item.partName,
          partNumber: item.partNumber,
          totalReceived: 0,
          totalIssued: 0,
          balance: 0,
          lastActivity: item.updatedAt
        });
      }
      
      const part = summary.get(key);
      part.totalReceived += item.receivedQty || 0;
      part.totalIssued += item.issuedQty || 0;
      part.balance = part.totalReceived - part.totalIssued;
      
      if (new Date(item.updatedAt) > new Date(part.lastActivity)) {
        part.lastActivity = item.updatedAt;
      }
    });

    // Header สำหรับ Summary
    const headers = [
      'MYOB Number',
      'Part Name', 
      'Part Number',
      'Total Received',
      'Total Issued',
      'Balance',
      'Last Activity'
    ];

    // Data rows สำหรับ Summary
    const rows = Array.from(summary.values()).map(part => [
      part.myobNumber,
      part.partName,
      part.partNumber,
      part.totalReceived,
      part.totalIssued,
      part.balance,
      new Date(part.lastActivity).toLocaleString('th-TH')
    ]);

    // เพิ่มสรุปรวม
    const totalReceived = Array.from(summary.values()).reduce((sum, part) => sum + part.totalReceived, 0);
    const totalIssued = Array.from(summary.values()).reduce((sum, part) => sum + part.totalIssued, 0);
    const totalBalance = totalReceived - totalIssued;

    rows.unshift(['=== SUMMARY ===', '', '', totalReceived, totalIssued, totalBalance, '']);
    rows.unshift(['Total Parts', summary.size, '', '', '', '', '']);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return '\ufeff' + csvContent;
  }

  async exportCurrentDataToExcel() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const result = await this.createExcelBackup(timestamp);
      
      console.log('📊 Export Excel สำเร็จ!');
      console.log(`📄 รายละเอียด: ${result.fileName}`);
      console.log(`📋 สรุป: ${result.summaryFileName}`);
      
      return result;
    } catch (error) {
      console.error('❌ Export Excel ล้มเหลว:', error);
      return { success: false, error: error.message };
    }
  }

  // ฟังก์ชันใหม่: สร้าง FIFO Excel รวมทุก Part ในไฟล์เดียว
  async createCombinedFIFOExcel(timestamp) {
    try {
      // ดึงข้อมูลทั้งหมด
      const allData = await prisma.stockItem.findMany({
        orderBy: [
          { myobNumber: 'asc' },
          { partNumber: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      // จัดกลุ่มตาม Part
      const partGroups = this.groupDataByPart(allData);
      
      // สร้างไฟล์ Excel รวม
      const combinedContent = this.createCombinedFIFOContent(partGroups);
      
      const fileName = `Combined-FIFO-All-Parts-${timestamp}.csv`;
      const filePath = path.join(this.excelDir, fileName);
      
      fs.writeFileSync(filePath, combinedContent, 'utf8');

      console.log(`✅ สร้าง Combined FIFO Excel สำเร็จ!`);
      console.log(`📊 จำนวน Parts: ${Object.keys(partGroups).length}`);
      console.log(`📄 ไฟล์: ${fileName}`);
      
      return {
        success: true,
        fileName,
        filePath,
        partCount: Object.keys(partGroups).length,
        format: 'Combined FIFO Excel'
      };

    } catch (error) {
      console.error('❌ สร้าง Combined FIFO Excel ล้มเหลว:', error);
      return { success: false, error: error.message };
    }
  }

  // จัดกลุ่มข้อมูลตาม Part
  groupDataByPart(data) {
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

  // สร้างเนื้อหา Excel รวมทุก Part
  createCombinedFIFOContent(partGroups) {
    let content = '';
    
    // Header หลัก
    content += '=== COMBINED FIFO REPORT - ทุก Parts ในไฟล์เดียว ===\n';
    content += `สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}\n`;
    content += `จำนวน Parts ทั้งหมด: ${Object.keys(partGroups).length}\n\n`;
    
    // สรุปภาพรวม
    content += '=== สรุปภาพรวมทุก Parts ===\n';
    content += '"Part Number","MYOB Number","Part Name","Model","Total Received","Total Issued","Balance","Last Activity"\n';
    
    let grandTotalReceived = 0;
    let grandTotalIssued = 0;
    
    Object.entries(partGroups).forEach(([partKey, partData]) => {
      const summary = this.calculatePartSummary(partData.transactions);
      grandTotalReceived += summary.totalReceived;
      grandTotalIssued += summary.totalIssued;
      
      content += `"${partData.info.partNumber}","${partData.info.myobNumber}","${partData.info.partName}","${partData.info.model}","${summary.totalReceived}","${summary.totalIssued}","${summary.balance}","${new Date(summary.lastActivity).toLocaleString('th-TH')}"\n`;
    });
    
    // สรุปรวม
    content += '\n"=== GRAND TOTAL ==="\n';
    content += `"Total Parts:","${Object.keys(partGroups).length}","","","${grandTotalReceived}","${grandTotalIssued}","${grandTotalReceived - grandTotalIssued}",""\n\n`;
    
    // รายละเอียดแต่ละ Part
    Object.entries(partGroups).forEach(([partKey, partData], index) => {
      content += `\n=== PART ${index + 1}: ${partKey} ===\n`;
      content += this.createPartDetailSection(partData);
      content += '\n';
    });
    
    return '\ufeff' + content;
  }

  // สร้างส่วนรายละเอียดของแต่ละ Part
  createPartDetailSection(partData) {
    const info = partData.info;
    let section = '';
    
    // ข้อมูล Part
    section += `"Part Information"\n`;
    section += `"MYOB Number:","${info.myobNumber}"\n`;
    section += `"Part Number:","${info.partNumber}"\n`;
    section += `"Part Name:","${info.partName}"\n`;
    section += `"Model:","${info.model}"\n\n`;
    
    // ตาราง FIFO
    section += '"Date","Time","Transaction Type","Reference","Qty","Running Balance","Party","Remarks"\n';
    
    let runningBalance = 0;
    const fifoTransactions = this.calculateFIFOTransactions(partData.transactions);
    
    fifoTransactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString('th-TH');
      const time = new Date(transaction.date).toLocaleTimeString('th-TH');
      const qty = transaction.type === 'IN' ? transaction.qty : -transaction.qty;
      runningBalance += qty;
      
      section += `"${date}","${time}","${transaction.description}","${transaction.reference}","${qty}","${runningBalance}","${transaction.party}","${transaction.remarks}"\n`;
    });
    
    // สรุป Part นี้
    const summary = this.calculatePartSummary(partData.transactions);
    section += '\n"=== PART SUMMARY ==="\n';
    section += `"Total Received:","${summary.totalReceived}"\n`;
    section += `"Total Issued:","${summary.totalIssued}"\n`;
    section += `"Current Balance:","${summary.balance}"\n`;
    section += `"Last Activity:","${new Date(summary.lastActivity).toLocaleString('th-TH')}"\n`;
    
    return section;
  }

  // คำนวณ FIFO Transactions
  calculateFIFOTransactions(transactions) {
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

  // คำนวณสรุป Part (ใช้ฟังก์ชันเดิม)
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

  listBackupFiles() {
    const jsonFiles = fs.readdirSync(this.backupDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        type: 'JSON',
        path: path.join(this.backupDir, file),
        size: fs.statSync(path.join(this.backupDir, file)).size,
        mtime: fs.statSync(path.join(this.backupDir, file)).mtime
      }));

    const excelFiles = fs.readdirSync(this.excelDir)
      .filter(file => file.endsWith('.csv'))
      .map(file => ({
        name: file,
        type: 'Excel/CSV',
        path: path.join(this.excelDir, file),
        size: fs.statSync(path.join(this.excelDir, file)).size,
        mtime: fs.statSync(path.join(this.excelDir, file)).mtime
      }));

    return [...jsonFiles, ...excelFiles]
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
  }
}

module.exports = ExcelBackupManager;
