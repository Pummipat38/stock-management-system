import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const normalizeNullableText = (value: unknown) => {
  const text = String(value ?? '').trim();
  return text ? text : null;
};

const buildDateOrUndefined = (value: unknown) => {
  if (!value) return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const buildDedupeKey = (item: any) => {
  const issueDate = item.issueDate ? new Date(item.issueDate).toISOString() : '';
  const receivedDate = item.receivedDate ? new Date(item.receivedDate).toISOString() : '';
  return [
    String(item.myobNumber ?? ''),
    String(item.model ?? ''),
    String(item.partNumber ?? ''),
    String(item.poNumber ?? ''),
    String(item.receivedQty ?? 0),
    String(item.issuedQty ?? 0),
    String(item.invoiceNumber ?? ''),
    issueDate,
    receivedDate,
    String(item.customer ?? ''),
    String(item.supplier ?? ''),
    String(item.event ?? ''),
    String(item.withdrawalNumber ?? ''),
  ].join('||');
};

// GET /api/stock
export async function GET() {
  try {
    const stockItems = await prisma.stockItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    // ตรวจสอบและส่งข้อมูลเป็น array เสมอ
    const raw = Array.isArray(stockItems) ? stockItems : [];

    // ลดเวลา dedupe window เพื่อลดปัญหาการกรองข้อมูลที่อาจจะกรองข้อมูลจริงไป
    const dedupeWindowMs = 1 * 60 * 1000; // 1 นาที
    const keptByKey = new Map<string, any>();
    const result: any[] = [];

    const sorted = raw
      .slice()
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (const item of sorted) {
      const key = buildDedupeKey(item);
      const prev = keptByKey.get(key);
      if (prev) {
        const prevTs = new Date(prev.createdAt).getTime();
        const curTs = new Date(item.createdAt).getTime();
        if (!Number.isNaN(prevTs) && !Number.isNaN(curTs) && curTs - prevTs <= dedupeWindowMs) {
          continue;
        }
      }
      keptByKey.set(key, item);
      result.push(item);
    }

    result.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 's-maxage=10, stale-while-revalidate=60',
      },
    });
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

    const receivedDate = buildDateOrUndefined(data.receivedDate) || new Date();

    const normalized = {
      myobNumber: String(data.myobNumber),
      model: String(data.model),
      partName: String(data.partName),
      partNumber: String(data.partNumber),
      revision: String(data.revision || ''),
      poNumber: String(data.poNumber),
      receivedQty: Number(data.receivedQty) || 0,
      receivedDate,
      supplier: normalizeNullableText(data.supplier),
      customer: normalizeNullableText(data.customer),
      issuedQty: data.issuedQty ? Number(data.issuedQty) : null,
      invoiceNumber: normalizeNullableText(data.invoiceNumber),
      issueDate: buildDateOrUndefined(data.issueDate),
      dueDate: buildDateOrUndefined(data.dueDate),
      event: normalizeNullableText(data.event),
      withdrawalNumber: normalizeNullableText(data.withdrawalNumber),
      remarks: normalizeNullableText(data.remarks),
    };

    const createdAfter = new Date(Date.now() - 2 * 60 * 1000);

    const where: any = {
      myobNumber: normalized.myobNumber,
      model: normalized.model,
      partName: normalized.partName,
      partNumber: normalized.partNumber,
      revision: normalized.revision,
      poNumber: normalized.poNumber,
      receivedQty: normalized.receivedQty,
      issuedQty: normalized.issuedQty,
      invoiceNumber: normalized.invoiceNumber,
      receivedDate: normalized.receivedDate,
      supplier: normalized.supplier,
      customer: normalized.customer,
      event: normalized.event,
      withdrawalNumber: normalized.withdrawalNumber,
      remarks: normalized.remarks,
      createdAt: {
        gte: createdAfter,
      },
    };

    if (normalized.issueDate) where.issueDate = normalized.issueDate;
    if (normalized.dueDate) where.dueDate = normalized.dueDate;

    const existing = await prisma.stockItem.findFirst({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const stockItem = await prisma.stockItem.create({
      data: {
        myobNumber: normalized.myobNumber,
        model: normalized.model,
        partName: normalized.partName,
        partNumber: normalized.partNumber,
        revision: normalized.revision,
        poNumber: normalized.poNumber,
        receivedQty: normalized.receivedQty,
        receivedDate: normalized.receivedDate,
        supplier: normalized.supplier,
        customer: normalized.customer,
        issuedQty: normalized.issuedQty,
        invoiceNumber: normalized.invoiceNumber,
        issueDate: normalized.issueDate ?? null,
        dueDate: normalized.dueDate ?? null,
        event: normalized.event,
        withdrawalNumber: normalized.withdrawalNumber,
        remarks: normalized.remarks,
      },
    });
    
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
  }
}
