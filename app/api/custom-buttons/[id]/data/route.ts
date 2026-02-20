import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const buttonData = await prisma.customButtonData.findMany({
      where: { buttonId: params.id },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(buttonData);
  } catch (error) {
    console.error('Error fetching button data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch button data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { fieldName, fieldValue, fieldType } = await request.json();
    
    if (!fieldName || !fieldValue) {
      return NextResponse.json(
        { error: 'Field name and value are required' },
        { status: 400 }
      );
    }
    
    const buttonData = await prisma.customButtonData.create({
      data: {
        buttonId: params.id,
        fieldName,
        fieldValue,
        fieldType: fieldType || 'text'
      }
    });
    
    return NextResponse.json(buttonData, { status: 201 });
  } catch (error) {
    console.error('Error creating button data:', error);
    return NextResponse.json(
      { error: 'Failed to create button data' },
      { status: 500 }
    );
  }
}
