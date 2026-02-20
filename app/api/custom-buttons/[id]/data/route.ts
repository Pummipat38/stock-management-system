import { NextRequest, NextResponse } from 'next/server';

// Mock data for testing
let mockButtonData = [
  {
    id: '1',
    buttonId: '1',
    fieldName: 'Model Name',
    fieldValue: 'ABC-123',
    fieldType: 'text',
    createdAt: new Date().toISOString()
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const buttonData = mockButtonData.filter(item => item.buttonId === params.id);
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
    
    const newButtonData = {
      id: Date.now().toString(),
      buttonId: params.id,
      fieldName,
      fieldValue,
      fieldType: fieldType || 'text',
      createdAt: new Date().toISOString()
    };
    
    mockButtonData.push(newButtonData);
    
    return NextResponse.json(newButtonData, { status: 201 });
  } catch (error) {
    console.error('Error creating button data:', error);
    return NextResponse.json(
      { error: 'Failed to create button data' },
      { status: 500 }
    );
  }
}
