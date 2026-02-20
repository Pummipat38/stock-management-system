import { NextRequest, NextResponse } from 'next/server';

// Mock data for testing without database
const mockButtons = [
  {
    id: '1',
    name: 'MODEL',
    color: 'blue',
    description: 'จัดการข้อมูล Model',
    createdAt: new Date().toISOString()
  }
];

const mockButtonData = [
  {
    id: '1',
    buttonId: '1',
    fieldName: 'Model Name',
    fieldValue: 'ABC-123',
    fieldType: 'text',
    createdAt: new Date().toISOString()
  }
];

export async function GET() {
  try {
    return NextResponse.json(mockButtons);
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
