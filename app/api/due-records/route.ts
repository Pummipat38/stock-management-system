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

export async function GET(request: Request) {
  try {
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
        'Cache-Control': 's-maxage=10, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching due records:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to fetch due records', details: details.slice(0, 800) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as DueRecordInput;

    const deliveryType = normalizeText(data.deliveryType);
    const customer = normalizeText(data.customer);
    const model = normalizeText(data.model);
    const partNumber = normalizeText(data.partNumber);
    const partName = normalizeText(data.partName);
    const revisionLevel = normalizeText(data.revisionLevel);
    const revisionNumber = normalizeText(data.revisionNumber);
    const event = normalizeText(data.event);
    const customerPo = normalizeText(data.customerPo);
    const dueDate = normalizeText(data.dueDate);

    const quantity = Number(data.quantity) || 0;

    if (!deliveryType || !customer || !model || !partNumber || !partName || !event || !customerPo || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dedupeKey = computeDedupeKey({
      ...data,
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

    const createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
    const updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
    const deliveredAt =
      data.deliveredAt === null || data.deliveredAt === undefined || data.deliveredAt === ''
        ? null
        : new Date(data.deliveredAt);

    const record = await prisma.dueRecord.upsert({
      where: { dedupeKey },
      create: {
        dedupeKey,
        deliveryType,
        myobNumber: normalizeText(data.myobNumber),
        productRequestNo: normalizeText(data.productRequestNo),
        customer,
        countryOfOrigin: normalizeText(data.countryOfOrigin),
        sampleRequestSheet: normalizeText(data.sampleRequestSheet),
        model,
        partNumber,
        partName,
        revisionLevel,
        revisionNumber,
        event,
        customerPo,
        supplier: normalizeText(data.supplier),
        prPo: normalizeText(data.prPo),
        purchase: normalizeText(data.purchase),
        invoiceIn: normalizeText(data.invoiceIn),
        invoiceOut: normalizeText(data.invoiceOut),
        withdrawalNumber: normalizeText(data.withdrawalNumber),
        quantity,
        dueDate,
        dueSupplierToCustomer: normalizeText(data.dueSupplierToCustomer),
        dueSupplierToRk: normalizeText(data.dueSupplierToRk),
        dueRkToCustomer: normalizeText(data.dueRkToCustomer),
        isDelivered: Boolean(data.isDelivered),
        deliveredAt,
        ...(createdAt ? { createdAt } : {}),
        ...(updatedAt ? { updatedAt } : {}),
      },
      update: {
        deliveryType,
        myobNumber: normalizeText(data.myobNumber),
        productRequestNo: normalizeText(data.productRequestNo),
        customer,
        countryOfOrigin: normalizeText(data.countryOfOrigin),
        sampleRequestSheet: normalizeText(data.sampleRequestSheet),
        model,
        partNumber,
        partName,
        revisionLevel,
        revisionNumber,
        event,
        customerPo,
        supplier: normalizeText(data.supplier),
        prPo: normalizeText(data.prPo),
        purchase: normalizeText(data.purchase),
        invoiceIn: normalizeText(data.invoiceIn),
        invoiceOut: normalizeText(data.invoiceOut),
        withdrawalNumber: normalizeText(data.withdrawalNumber),
        quantity,
        dueDate,
        dueSupplierToCustomer: normalizeText(data.dueSupplierToCustomer),
        dueSupplierToRk: normalizeText(data.dueSupplierToRk),
        dueRkToCustomer: normalizeText(data.dueRkToCustomer),
        isDelivered: Boolean(data.isDelivered),
        deliveredAt,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating due record:', error);
    return NextResponse.json(
      { error: 'Failed to create due record' },
      { status: 500 }
    );
  }
}
