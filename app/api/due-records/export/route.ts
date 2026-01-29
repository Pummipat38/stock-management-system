import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function isAuthorized(request: Request) {
  const expected = process.env.DUE_SYNC_KEY;
  if (!expected) return false;
  const provided = request.headers.get('x-sync-key');
  return Boolean(provided && provided === expected);
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const deliveryType = searchParams.get('deliveryType');
    const isDeliveredParam = searchParams.get('isDelivered');

    const where: Record<string, unknown> = {};

    if (deliveryType) where.deliveryType = deliveryType;

    if (isDeliveredParam === 'true') where.isDelivered = true;
    if (isDeliveredParam === 'false') where.isDelivered = false;

    const records = await prisma.dueRecord.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
    });

    return NextResponse.json(records, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting due records:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to export due records', details },
      { status: 500 }
    );
  }
}
