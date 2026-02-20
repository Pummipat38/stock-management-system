import { NextRequest, NextResponse } from 'next/server';

// Mock data for testing
let mockButtons = [
  {
    id: '1',
    name: 'MODEL',
    color: 'blue',
    description: 'จัดการข้อมูล Model',
    createdAt: new Date().toISOString()
  }
];

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    mockButtons = mockButtons.filter(button => button.id !== params.id);
    mockButtonData = mockButtonData.filter(data => data.buttonId !== params.id);
    
    return NextResponse.json({ message: 'Button deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom button:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom button' },
      { status: 500 }
    );
  }
}
