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
  mockButtons = mockButtons.filter(button => button.id !== params.id);
  mockButtonData = mockButtonData.filter(data => data.buttonId !== params.id);
  
  return NextResponse.json({ message: 'Button deleted successfully' });
}
