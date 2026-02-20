import { NextRequest, NextResponse } from 'next/server';

// Mock data fallback
let mockButtons = [
  {
    id: '1',
    name: 'MODEL',
    color: 'blue',
    description: 'จัดการข้อมูล Model',
    createdAt: new Date().toISOString()
  }
];

export async function GET() {
  try {
    // Try to use Prisma first
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const buttons = await prisma.customButton.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      await prisma.$disconnect();
      return NextResponse.json(buttons);
    } catch (prismaError) {
      console.log('Prisma not available, using mock data:', prismaError);
      // Fallback to mock data
      return NextResponse.json(mockButtons);
    }
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
    
    // Try to use Prisma first
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const button = await prisma.customButton.create({
        data: {
          name,
          color: color || 'blue',
          description: description || ''
        }
      });
      
      await prisma.$disconnect();
      return NextResponse.json(button, { status: 201 });
    } catch (prismaError) {
      console.log('Prisma not available, using mock data:', prismaError);
      // Fallback to mock data
      const newButton = {
        id: Date.now().toString(),
        name,
        color: color || 'blue',
        description: description || '',
        createdAt: new Date().toISOString()
      };
      
      mockButtons.push(newButton);
      return NextResponse.json(newButton, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating custom button:', error);
    return NextResponse.json(
      { error: 'Failed to create custom button' },
      { status: 500 }
    );
  }
}
