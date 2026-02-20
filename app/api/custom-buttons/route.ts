import { NextRequest, NextResponse } from 'next/server';

// Simple mock-only version to avoid runtime crashes
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
  return NextResponse.json(mockButtons);
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
    
    const newButton = {
      id: Date.now().toString(),
      name,
      color: color || 'blue',
      description: description || '',
      createdAt: new Date().toISOString()
    };
    
    mockButtons.push(newButton);
    return NextResponse.json(newButton, { status: 201 });
  } catch (error) {
    console.error('Error creating custom button:', error);
    return NextResponse.json(
      { error: 'Failed to create custom button' },
      { status: 500 }
    );
  }
}
