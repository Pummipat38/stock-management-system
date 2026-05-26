import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: 'Database connection failed', details: details.slice(0, 800) },
      { status: 503 }
    );
  }
}
