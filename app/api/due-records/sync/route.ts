import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type DueRecordInput = {
  deliveryType?: string;
  myobNumber?: string;
  productRequestNo?: string;
  customer?: string;
  countryOfOrigin?: string;
  sampleRequestSheet?: string;
  model?: string;
  partNumber?: string;
  partName?: string;
  revisionLevel?: string;
  revisionNumber?: string;
  event?: string;
  supplier?: string;
  customerPo?: string;
  prPo?: string;
  purchase?: string;
  invoiceIn?: string;
  invoiceOut?: string;
  withdrawalNumber?: string;
  quantity?: number;
  dueDate?: string;
  dueSupplierToCustomer?: string;
  dueSupplierToRk?: string;
  dueRkToCustomer?: string;
  isDelivered?: boolean;
  deliveredAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function computeDedupeKey(input: DueRecordInput) {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const records = (Array.isArray(body) ? body : body?.records) as DueRecordInput[];

    if (!Array.isArray(records)) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    let upserted = 0;

    for (const item of records) {
      const deliveryType = normalizeText(item.deliveryType);
      const customer = normalizeText(item.customer);
      const model = normalizeText(item.model);
      const partNumber = normalizeText(item.partNumber);
      const partName = normalizeText(item.partName);
      const revisionLevel = normalizeText(item.revisionLevel);
      const revisionNumber = normalizeText(item.revisionNumber);
      const event = normalizeText(item.event);
      const customerPo = normalizeText(item.customerPo);
      const dueDate = normalizeText(item.dueDate);
      const quantity = Number(item.quantity) || 0;

      if (!deliveryType || !customer || !model || !partNumber || !partName || !event || !customerPo || !dueDate) {
        continue;
      }

      const dedupeKey = computeDedupeKey({
        ...item,
        deliveryType,
        customer,
        model,
        partNumber,
        partName,
        revisionLevel,
        revisionNumber,
        event,
        customerPo,
        dueDate,
        quantity,
      });

      const createdAt = item.createdAt ? new Date(item.createdAt) : undefined;
      const updatedAt = item.updatedAt ? new Date(item.updatedAt) : undefined;
      const deliveredAt =
        item.deliveredAt === null || item.deliveredAt === undefined || item.deliveredAt === ''
          ? null
          : new Date(item.deliveredAt);

      const createData = {
        dedupeKey,
        deliveryType,
        myobNumber: normalizeText(item.myobNumber),
        productRequestNo: normalizeText(item.productRequestNo),
        customer,
        countryOfOrigin: normalizeText(item.countryOfOrigin),
        sampleRequestSheet: normalizeText(item.sampleRequestSheet),
        model,
        partNumber,
        partName,
        revisionLevel,
        revisionNumber,
        event,
        customerPo,
        supplier: normalizeText(item.supplier),
        prPo: normalizeText(item.prPo),
        purchase: normalizeText(item.purchase),
        invoiceIn: normalizeText(item.invoiceIn),
        invoiceOut: normalizeText(item.invoiceOut),
        withdrawalNumber: normalizeText(item.withdrawalNumber),
        quantity,
        dueDate,
        dueSupplierToCustomer: normalizeText(item.dueSupplierToCustomer),
        dueSupplierToRk: normalizeText(item.dueSupplierToRk),
        dueRkToCustomer: normalizeText(item.dueRkToCustomer),
        isDelivered: Boolean(item.isDelivered),
        deliveredAt,
        ...(createdAt ? { createdAt } : {}),
        ...(updatedAt ? { updatedAt } : {}),
      };

      const updateData = {
        deliveryType,
        myobNumber: normalizeText(item.myobNumber),
        productRequestNo: normalizeText(item.productRequestNo),
        customer,
        countryOfOrigin: normalizeText(item.countryOfOrigin),
        sampleRequestSheet: normalizeText(item.sampleRequestSheet),
        model,
        partNumber,
        partName,
        revisionLevel,
        revisionNumber,
        event,
        customerPo,
        supplier: normalizeText(item.supplier),
        prPo: normalizeText(item.prPo),
        purchase: normalizeText(item.purchase),
        invoiceIn: normalizeText(item.invoiceIn),
        invoiceOut: normalizeText(item.invoiceOut),
        withdrawalNumber: normalizeText(item.withdrawalNumber),
        quantity,
        dueDate,
        dueSupplierToCustomer: normalizeText(item.dueSupplierToCustomer),
        dueSupplierToRk: normalizeText(item.dueSupplierToRk),
        dueRkToCustomer: normalizeText(item.dueRkToCustomer),
        isDelivered: Boolean(item.isDelivered),
        deliveredAt,
      };

      await prisma.dueRecord.upsert({
        where: { dedupeKey },
        create: createData as any,
        update: updateData as any,
      });

      upserted++;
    }

    return NextResponse.json({ ok: true, upserted });
  } catch (error) {
    console.error('Error syncing due records:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to sync due records', details },
      { status: 500 }
    );
  }
}
