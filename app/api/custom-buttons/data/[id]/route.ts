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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    mockButtonData = mockButtonData.filter(data => data.id !== params.id);
    
    return NextResponse.json({ message: 'Button data deleted successfully' });
  } catch (error) {
    console.error('Error deleting button data:', error);
    return NextResponse.json(
      { error: 'Failed to delete button data' },
      { status: 500 }
    );
  }
}
