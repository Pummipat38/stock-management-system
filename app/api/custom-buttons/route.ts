import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const buttons = await prisma.customButton.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(buttons);
  } catch (error) {
    console.error('Error fetching custom buttons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom buttons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, color, description } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Button name is required' },
        { status: 400 }
      );
    }
    
    const button = await prisma.customButton.create({
      data: {
        name,
        color: color || 'blue',
        description: description || ''
      }
    });
    
    return NextResponse.json(button, { status: 201 });
  } catch (error) {
    console.error('Error creating custom button:', error);
    return NextResponse.json(
      { error: 'Failed to create custom button' },
      { status: 500 }
    );
  }
}
