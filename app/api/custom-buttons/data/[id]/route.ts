import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customButtonData.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: 'Button data deleted successfully' });
  } catch (error) {
    console.error('Error deleting button data:', error);
    return NextResponse.json(
      { error: 'Failed to delete button data' },
      { status: 500 }
    );
  }
}
