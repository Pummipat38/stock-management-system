import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // สร้างรายการ NG ใหม่
    const ngRecord = await prisma.stockItem.create({
      data: {
        myobNumber: data.myobNumber,
        model: data.model,
        partName: data.partName,
        partNumber: data.partNumber,
        revision: data.revision || '',
        poNumber: data.poNumber || '',
        receivedQty: 0, // NG items มี receivedQty = 0
        receivedDate: new Date(data.receivedDate),
        supplier: data.supplier || '',
        issuedQty: data.issuedQty, // จำนวนที่จ่ายเป็น NG
        invoiceNumber: data.invoiceNumber || '',
        issueDate: new Date(),
        customer: data.customer || '',
        event: data.event || '',
        withdrawalNumber: data.withdrawalNumber || '',
        remarks: data.remarks || '',
      },
    });

    return NextResponse.json(ngRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating NG record:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล NG' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // ดึงข้อมูล NG ทั้งหมด (รายการที่ receivedQty = 0, issuedQty > 0 และ remarks เริ่มต้นด้วย "NG:")
    const ngItems = await prisma.stockItem.findMany({
      where: {
        receivedQty: 0,
        issuedQty: {
          gt: 0
        },
        remarks: {
          startsWith: 'NG:'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(ngItems);
  } catch (error) {
    console.error('Error fetching NG items:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล NG' },
      { status: 500 }
    );
  }
}
