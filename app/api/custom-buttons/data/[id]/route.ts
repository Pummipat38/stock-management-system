import { NextRequest, NextResponse } from 'next/server';

// Simple mock-only version to avoid runtime crashes
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
  mockButtonData = mockButtonData.filter(data => data.id !== params.id);
  
  return NextResponse.json({ message: 'Button data deleted successfully' });
}
