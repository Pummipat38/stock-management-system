import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type DueRecordPatch = {
  deliveryType?: string;
  myobNumber?: string;
  customer?: string;
  countryOfOrigin?: string;
  sampleRequestSheet?: string;
  model?: string;
  partNumber?: string;
  partName?: string;
  revisionLevel?: string;
  revisionNumber?: string;
  event?: string;
  customerPo?: string;
  quantity?: number;
  dueDate?: string;
  isDelivered?: boolean;
  deliveredAt?: string | null;
};

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function computeDedupeKey(input: DueRecordPatch) {
  return [
    normalizeText(input.deliveryType).toLowerCase(),
    normalizeText(input.myobNumber).toLowerCase(),
    normalizeText(input.customer).toLowerCase(),
    normalizeText(input.model).toLowerCase(),
    normalizeText(input.partNumber).toLowerCase(),
    normalizeText(input.partName).toLowerCase(),
    normalizeText(input.revisionLevel).toLowerCase(),
    normalizeText(input.revisionNumber).toLowerCase(),
    normalizeText(input.event).toLowerCase(),
    normalizeText(input.customerPo).toLowerCase(),
    normalizeText(input.dueDate),
    String(Number(input.quantity) || 0),
  ].join('|');
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const patch = (await request.json()) as DueRecordPatch;

    const existing = await prisma.dueRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const mergedDeliveredAt: string | null =
      patch.deliveredAt === undefined
        ? existing.deliveredAt
          ? existing.deliveredAt.toISOString()
          : null
        : patch.deliveredAt;

    const merged: Omit<DueRecordPatch, 'deliveredAt'> & { deliveredAt: string | null } = {
      deliveryType: patch.deliveryType ?? existing.deliveryType,
      myobNumber: patch.myobNumber ?? existing.myobNumber,
      customer: patch.customer ?? existing.customer,
      countryOfOrigin: patch.countryOfOrigin ?? existing.countryOfOrigin,
      sampleRequestSheet: patch.sampleRequestSheet ?? existing.sampleRequestSheet,
      model: patch.model ?? existing.model,
      partNumber: patch.partNumber ?? existing.partNumber,
      partName: patch.partName ?? existing.partName,
      revisionLevel: patch.revisionLevel ?? existing.revisionLevel,
      revisionNumber: patch.revisionNumber ?? existing.revisionNumber,
      event: patch.event ?? existing.event,
      customerPo: patch.customerPo ?? existing.customerPo,
      quantity: patch.quantity ?? existing.quantity,
      dueDate: patch.dueDate ?? existing.dueDate,
      isDelivered: patch.isDelivered ?? existing.isDelivered,
      deliveredAt: mergedDeliveredAt,
    };

    const dedupeKey = computeDedupeKey(merged);

    const deliveredAt =
      merged.deliveredAt === null || merged.deliveredAt === '' ? null : new Date(merged.deliveredAt);

    const updated = await prisma.dueRecord.update({
      where: { id },
      data: {
        dedupeKey,
        deliveryType: normalizeText(merged.deliveryType),
        myobNumber: normalizeText(merged.myobNumber),
        customer: normalizeText(merged.customer),
        countryOfOrigin: normalizeText(merged.countryOfOrigin),
        sampleRequestSheet: normalizeText(merged.sampleRequestSheet),
        model: normalizeText(merged.model),
        partNumber: normalizeText(merged.partNumber),
        partName: normalizeText(merged.partName),
        revisionLevel: normalizeText(merged.revisionLevel),
        revisionNumber: normalizeText(merged.revisionNumber),
        event: normalizeText(merged.event),
        customerPo: normalizeText(merged.customerPo),
        quantity: Number(merged.quantity) || 0,
        dueDate: normalizeText(merged.dueDate),
        isDelivered: Boolean(merged.isDelivered),
        deliveredAt,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating due record:', error);
    return NextResponse.json(
      { error: 'Failed to update due record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.dueRecord.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting due record:', error);
    return NextResponse.json(
      { error: 'Failed to delete due record' },
      { status: 500 }
    );
  }
}
