import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/stock/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const stockItem = await prisma.stockItem.findUnique({
      where: { id: params.id },
    });

    if (!stockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stockItem);
  } catch (error) {
    console.error('Error fetching stock item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock item' },
      { status: 500 }
    );
  }
}

// PUT /api/stock/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const updatedItem = await prisma.stockItem.update({
      where: { id: params.id },
      data: {
        myobNumber: data.myobNumber ? String(data.myobNumber) : undefined,
        model: data.model ? String(data.model) : undefined,
        partName: data.partName ? String(data.partName) : undefined,
        partNumber: data.partNumber ? String(data.partNumber) : undefined,
        revision: data.revision ? String(data.revision) : undefined,
        poNumber: data.poNumber ? String(data.poNumber) : undefined,
        receivedQty: data.receivedQty ? Number(data.receivedQty) : undefined,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
        supplier: data.supplier ? String(data.supplier) : undefined,
        customer: data.customer || undefined,
        issuedQty: data.issuedQty ? Number(data.issuedQty) : undefined,
        invoiceNumber: data.invoiceNumber ? String(data.invoiceNumber) : undefined,
        issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        event: data.event ? String(data.event) : undefined,
        withdrawalNumber: data.withdrawalNumber ? String(data.withdrawalNumber) : undefined,
        remarks: data.remarks ? String(data.remarks) : undefined,
      },
    });
    
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating stock item:', error);
    return NextResponse.json(
      { error: 'Failed to update stock item' },
      { status: 500 }
    );
  }
}

// DELETE /api/stock/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.stockItem.delete({
      where: { id: params.id },
    });
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting stock item:', error);
    return NextResponse.json(
      { error: 'Failed to delete stock item' },
      { status: 500 }
    );
  }
}
