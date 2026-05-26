import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
