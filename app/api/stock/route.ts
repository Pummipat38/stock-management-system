import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// GET /api/stock
export async function GET() {
  try {
    const stockItems = await prisma.stockItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    // ตรวจสอบและส่งข้อมูลเป็น array เสมอ
    const result = Array.isArray(stockItems) ? stockItems : [];
    console.log('API Response:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching stock items:', error);
    // ส่ง empty array แทนการส่ง error object
    return NextResponse.json([]);
  }
}

// POST /api/stock
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received data:', data);
    
    // Validate required fields
    if (!data.myobNumber || !data.model || !data.partName || !data.partNumber || !data.poNumber) {
      console.error('Missing required fields:', {
        myobNumber: !!data.myobNumber,
        model: !!data.model,
        partName: !!data.partName,
        partNumber: !!data.partNumber,
        poNumber: !!data.poNumber
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure database connection
    await prisma.$connect();
    console.log('Database connected');

    const stockItem = await prisma.stockItem.create({
      data: {
        myobNumber: String(data.myobNumber),
        model: String(data.model),
        partName: String(data.partName),
        partNumber: String(data.partNumber),
        revision: String(data.revision || ''),
        poNumber: String(data.poNumber),
        receivedQty: Number(data.receivedQty) || 0,
        receivedDate: new Date(data.receivedDate),
        supplier: data.supplier ? String(data.supplier) : null,
        customer: data.customer || null,
        issuedQty: data.issuedQty ? Number(data.issuedQty) : null,
        invoiceNumber: data.invoiceNumber ? String(data.invoiceNumber) : null,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        event: data.event ? String(data.event) : null,
        withdrawalNumber: data.withdrawalNumber ? String(data.withdrawalNumber) : null,
        remarks: data.remarks ? String(data.remarks) : null,
      },
    });
    
    console.log('Created stock item:', stockItem);
    
    // สร้าง Backup หลังจากเซฟข้อมูลสำเร็จ
    try {
      const BackupManager = require('../../../lib/backup');
      const backupManager = new BackupManager();
      await backupManager.createBackup('data-entry');
      console.log('✅ Auto backup after data entry completed');
    } catch (backupError) {
      const errorMsg = backupError instanceof Error ? backupError.message : 'Unknown backup error';
      console.error('⚠️ Backup failed but data saved:', errorMsg);
    }
    
    return NextResponse.json(stockItem, { status: 201 });
  } catch (error) {
    console.error('Error creating stock item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    // Check if it's a database connection error
    if (errorMessage.includes('connect') || errorMessage.includes('database')) {
      return NextResponse.json(
        { error: 'Database connection failed', details: errorMessage },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create stock item', details: errorMessage },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
