import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // สร้างรายการ NG ใหม่ในตาราง NGItem แยกต่างหาก
    const ngRecord = await prisma.nGItem.create({
      data: {
        myobNumber: data.myobNumber,
        model: data.model,
        partName: data.partName,
        partNumber: data.partNumber,
        revision: data.revision || '',
        poNumber: data.poNumber || '',
        receivedDate: new Date(data.receivedDate),
        supplier: data.supplier || '',
        issuedQty: data.issuedQty,
        invoiceNumber: data.invoiceNumber || '',
        issueDate: new Date(data.issueDate),
        customer: data.customer || '',
        event: data.event || '',
        withdrawalNumber: data.withdrawalNumber || '',
        ngProblem: data.ngProblem || '',
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
    // ดึงข้อมูล NG ทั้งหมดจากตาราง NGItem
    const ngItems = await prisma.nGItem.findMany({
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
