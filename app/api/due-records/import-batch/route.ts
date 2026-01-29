import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

type PreparedDueRecord = {
  id: string;
  dedupeKey: string;
  deliveryType: string;
  myobNumber: string;
  productRequestNo: string;
  customer: string;
  countryOfOrigin: string;
  sampleRequestSheet: string;
  model: string;
  partNumber: string;
  partName: string;
  revisionLevel: string;
  revisionNumber: string;
  event: string;
  supplier: string;
  customerPo: string;
  prPo: string;
  purchase: string;
  invoiceIn: string;
  invoiceOut: string;
  withdrawalNumber: string;
  quantity: number;
  dueDate: string;
  dueSupplierToCustomer: string;
  dueSupplierToRk: string;
  dueRkToCustomer: string;
  isDelivered: boolean;
  deliveredAt: Date | null;
};

export async function POST(request: Request) {
  try {
    const expected = process.env.DUE_IMPORT_KEY;
    if (!expected) {
      return NextResponse.json(
        { error: 'Import is not configured (missing DUE_IMPORT_KEY)' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const key = normalizeText(body?.key);
    if (!key || key !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const records = (Array.isArray(body?.records) ? body.records : []) as DueRecordInput[];
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Missing records' }, { status: 400 });
    }

    const prepared: PreparedDueRecord[] = [];
    let skipped = 0;

    for (const item of records) {
      const deliveryType = normalizeText(item.deliveryType);
      const myobNumber = normalizeText(item.myobNumber);
      const productRequestNo = normalizeText(item.productRequestNo);
      const customer = normalizeText(item.customer);
      const countryOfOrigin = normalizeText(item.countryOfOrigin);
      const sampleRequestSheet = normalizeText(item.sampleRequestSheet);
      const model = normalizeText(item.model);
      const partNumber = normalizeText(item.partNumber);
      const partName = normalizeText(item.partName);
      const revisionLevel = normalizeText(item.revisionLevel);
      const revisionNumber = normalizeText(item.revisionNumber);
      const event = normalizeText(item.event);
      const supplier = normalizeText(item.supplier);
      const customerPo = normalizeText(item.customerPo);
      const prPo = normalizeText(item.prPo);
      const purchase = normalizeText(item.purchase);
      const invoiceIn = normalizeText(item.invoiceIn);
      const invoiceOut = normalizeText(item.invoiceOut);
      const withdrawalNumber = normalizeText(item.withdrawalNumber);
      const dueDate = normalizeText(item.dueDate);
      const dueSupplierToCustomer = normalizeText(item.dueSupplierToCustomer);
      const dueSupplierToRk = normalizeText(item.dueSupplierToRk);
      const dueRkToCustomer = normalizeText(item.dueRkToCustomer);
      const quantity = Number(item.quantity) || 0;

      if (!deliveryType || !customer || !model || !partNumber || !partName || !event || !customerPo || !dueDate) {
        skipped++;
        continue;
      }

      const dedupeKey = computeDedupeKey({
        ...item,
        deliveryType,
        myobNumber,
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

      const deliveredAt =
        item.deliveredAt === null || item.deliveredAt === undefined || item.deliveredAt === ''
          ? null
          : new Date(String(item.deliveredAt));

      prepared.push({
        id: randomUUID(),
        dedupeKey,
        deliveryType,
        myobNumber,
        productRequestNo,
        customer,
        countryOfOrigin,
        sampleRequestSheet,
        model,
        partNumber,
        partName,
        revisionLevel,
        revisionNumber,
        event,
        supplier,
        customerPo,
        prPo,
        purchase,
        invoiceIn,
        invoiceOut,
        withdrawalNumber,
        quantity,
        dueDate,
        dueSupplierToCustomer,
        dueSupplierToRk,
        dueRkToCustomer,
        isDelivered: Boolean(item.isDelivered),
        deliveredAt,
      });
    }

    const chunks = chunkArray(prepared, 200);
    let upserted = 0;
    const errors: Array<{ batch: number; message: string }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.length === 0) continue;

      try {
        const values = chunk.map(r =>
          Prisma.sql`(
            ${r.id},
            ${r.dedupeKey},
            ${r.deliveryType},
            ${r.myobNumber},
            ${r.productRequestNo},
            ${r.customer},
            ${r.countryOfOrigin},
            ${r.sampleRequestSheet},
            ${r.model},
            ${r.partNumber},
            ${r.partName},
            ${r.revisionLevel},
            ${r.revisionNumber},
            ${r.event},
            ${r.supplier},
            ${r.customerPo},
            ${r.prPo},
            ${r.purchase},
            ${r.invoiceIn},
            ${r.invoiceOut},
            ${r.withdrawalNumber},
            ${r.quantity},
            ${r.dueDate},
            ${r.dueSupplierToCustomer},
            ${r.dueSupplierToRk},
            ${r.dueRkToCustomer},
            ${r.isDelivered},
            ${r.deliveredAt}
          )`
        );

        const query = Prisma.sql`
          insert into due_records (
            id,
            dedupe_key,
            delivery_type,
            myob_number,
            product_request_no,
            customer,
            country_of_origin,
            sample_request_sheet,
            model,
            part_number,
            part_name,
            revision_level,
            revision_number,
            event,
            supplier,
            customer_po,
            pr_po,
            purchase,
            invoice_in,
            invoice_out,
            withdrawal_number,
            quantity,
            due_date,
            due_supplier_to_customer,
            due_supplier_to_rk,
            due_rk_to_customer,
            is_delivered,
            delivered_at
          )
          values ${Prisma.join(values)}
          on conflict (dedupe_key) do update set
            delivery_type = excluded.delivery_type,
            myob_number = excluded.myob_number,
            product_request_no = excluded.product_request_no,
            customer = excluded.customer,
            country_of_origin = excluded.country_of_origin,
            sample_request_sheet = excluded.sample_request_sheet,
            model = excluded.model,
            part_number = excluded.part_number,
            part_name = excluded.part_name,
            revision_level = excluded.revision_level,
            revision_number = excluded.revision_number,
            event = excluded.event,
            supplier = excluded.supplier,
            customer_po = excluded.customer_po,
            pr_po = excluded.pr_po,
            purchase = excluded.purchase,
            invoice_in = excluded.invoice_in,
            invoice_out = excluded.invoice_out,
            withdrawal_number = excluded.withdrawal_number,
            quantity = excluded.quantity,
            due_date = excluded.due_date,
            due_supplier_to_customer = excluded.due_supplier_to_customer,
            due_supplier_to_rk = excluded.due_supplier_to_rk,
            due_rk_to_customer = excluded.due_rk_to_customer,
            is_delivered = excluded.is_delivered,
            delivered_at = excluded.delivered_at,
            updated_at = now();
        `;

        const affected = await prisma.$executeRaw(query);
        upserted += typeof affected === 'number' ? affected : 0;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ batch: i + 1, message: msg });
      }
    }

    return NextResponse.json({
      ok: true,
      received: records.length,
      accepted: prepared.length,
      skipped,
      upserted,
      errorsCount: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error('Error importing due records batch:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to import due records batch', details },
      { status: 500 }
    );
  }
}
