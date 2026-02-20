import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customButton.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: 'Button deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom button:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom button' },
      { status: 500 }
    );
  }
}
