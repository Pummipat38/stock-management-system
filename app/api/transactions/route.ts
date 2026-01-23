import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stockItemId = searchParams.get('stockItemId');
    const type = searchParams.get('type');

    let whereClause: any = {};
    
    if (stockItemId) {
      whereClause.stockItemId = stockItemId;
    }
    
    if (type) {
      whereClause.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        stockItem: {
          select: {
            myobNumber: true,
            partName: true,
            partNumber: true,
          }
        }
      },
      orderBy: { transactionDate: 'desc' }
    });
    
    // ตรวจสอบและส่งข้อมูลเป็น array เสมอ
    const result = Array.isArray(transactions) ? transactions : [];
    console.log('API Response:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    // ส่ง empty array แทนการส่ง error object
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stockItemId, type, quantity, invoiceNumber, transactionDate, dueDate, remarks } = body;

    const transaction = await prisma.transaction.create({
      data: {
        stockItemId,
        type,
        quantity,
        invoiceNumber,
        transactionDate: new Date(transactionDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        remarks,
      },
      include: {
        stockItem: {
          select: {
            myobNumber: true,
            partName: true,
            partNumber: true,
          }
        }
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
