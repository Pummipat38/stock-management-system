import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

type DueRecordInput = {
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

export const runtime = 'nodejs';

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeDueDate(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return normalizeText(value);
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

function pick(row: Record<string, unknown>, aliases: string[]) {
  const normalizeKey = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9\u0E00-\u0E7F]/g, '');

  for (const key of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
    const found = Object.keys(row).find(k => k.trim().toLowerCase() === key.trim().toLowerCase());
    if (found) return row[found];

    const aliasNorm = normalizeKey(key);
    const foundLoose = Object.keys(row).find(k => {
      const kNorm = normalizeKey(k);
      if (!kNorm || !aliasNorm) return false;
      return kNorm.includes(aliasNorm) || aliasNorm.includes(kNorm);
    });
    if (foundLoose) return row[foundLoose];
  }
  return undefined;
}

function inferDeliveryTypeFromSheetName(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('inter')) return 'international';
  if (lower.includes('dom')) return 'domestic';
  if (lower.includes('ต่างประเทศ')) return 'international';
  if (lower.includes('ในประเทศ')) return 'domestic';
  return null;
}

function normalizeHeader(value: unknown) {
  return normalizeText(value).replace(/\s+/g, ' ').trim().toLowerCase();
}

const REQUIRED_HEADER_TOKENS = ['customer', 'model', 'part', 'event', 'qty', 'due', 'po'];

function scoreHeaderRow(cells: unknown[]) {
  const tokens = cells.map(normalizeHeader).filter(Boolean);
  let score = 0;
  for (const t of REQUIRED_HEADER_TOKENS) {
    if (tokens.some(v => v.includes(t))) score++;
  }
  return score;
}

function buildRowObject(headers: string[], row: unknown[]) {
  const obj: Record<string, unknown> = {};
  for (let i = 0; i < headers.length; i++) {
    const key = headers[i];
    if (!key) continue;
    obj[key] = row[i];
  }
  return obj;
}

async function checkDueRecordsSchema() {
  const expectedColumns = [
    'id',
    'dedupe_key',
    'delivery_type',
    'myob_number',
    'customer',
    'country_of_origin',
    'sample_request_sheet',
    'model',
    'part_number',
    'part_name',
    'revision_level',
    'revision_number',
    'event',
    'customer_po',
    'quantity',
    'due_date',
    'is_delivered',
    'delivered_at',
    'created_at',
    'updated_at',
  ];

  const rows = await prisma.$queryRaw<{ column_name: string }[]>`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'due_records'
  `;

  const existing = new Set((rows ?? []).map(r => String(r.column_name).toLowerCase()));
  const missing = expectedColumns.filter(c => !existing.has(c));
  return { missing };
}

export async function POST(request: Request) {
  try {
    const expected = process.env.DUE_IMPORT_KEY;
    if (!expected) {
      return NextResponse.json(
        { error: 'Import is not configured (missing DUE_IMPORT_KEY)' },
        { status: 500 }
      );
    }

    const form = await request.formData();
    const key = String(form.get('key') ?? '');
    if (!key || key !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    try {
      const { missing } = await checkDueRecordsSchema();
      if (missing.length > 0) {
        const sql = missing
          .filter(col => col !== 'id' && col !== 'dedupe_key')
          .map(col => {
            if (col === 'is_delivered') return `alter table due_records add column if not exists is_delivered boolean not null default false;`;
            if (col === 'quantity') return `alter table due_records add column if not exists quantity integer not null default 0;`;
            if (col === 'delivered_at') return `alter table due_records add column if not exists delivered_at timestamptz null;`;
            if (col === 'created_at' || col === 'updated_at') return `alter table due_records add column if not exists ${col} timestamptz not null default now();`;
            return `alter table due_records add column if not exists ${col} text not null default '';`;
          })
          .join('\n');

        return NextResponse.json(
          {
            error: 'Supabase table due_records is missing columns',
            missing,
            sql,
          },
          { status: 500 }
        );
      }
    } catch (schemaError) {
      const msg = schemaError instanceof Error ? schemaError.message : String(schemaError);
      return NextResponse.json(
        { error: 'Failed to validate due_records schema', details: msg },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const errors: Array<{ sheet: string; row: number; message: string }> = [];
    const skippedSamples: Array<{ sheet: string; row: number; missing: string[] }> = [];
    const skippedMissingCounts: Record<string, number> = {};
    let totalRows = 0;
    let parsedRows = 0;
    let upserted = 0;
    let skipped = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const inferredType = inferDeliveryTypeFromSheetName(sheetName);
      if (!inferredType) {
        continue;
      }

      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
        raw: false,
      });

      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(40, matrix.length); i++) {
        const score = scoreHeaderRow(matrix[i] ?? []);
        if (score >= 4) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        continue;
      }

      const headerRow = (matrix[headerRowIndex] ?? []).map(normalizeHeader);
      const dataRows = matrix.slice(headerRowIndex + 1);

      totalRows += dataRows.length;

      for (let idx = 0; idx < dataRows.length; idx++) {
        const rawRow = dataRows[idx] ?? [];
        const rowNumber = headerRowIndex + 2 + idx;

        const nonEmptyCount = rawRow.filter((v: unknown) => normalizeText(v) !== '').length;
        if (nonEmptyCount === 0) {
          continue;
        }

        const row = buildRowObject(headerRow, rawRow);

        const normalizedType = inferredType;

        const customer = normalizeText(pick(row, ['customer', 'CUSTOMER', 'Customer', 'ลูกค้า']));
        const model = normalizeText(pick(row, ['model', 'MODEL', 'Model', 'โมเดล']));
        const partNumber = normalizeText(pick(row, ['partNumber', 'part_number', 'PART NO', 'PART NO.', 'PART NO ', 'Part No', 'part no', 'Part No.', 'part no.', 'พาร์ท', 'พาร์ทโน', 'PART NO.']));
        const partName = normalizeText(pick(row, ['partName', 'part_name', 'PART NAME', 'Part Name', 'part name', 'ชื่อชิ้นส่วน', 'PART NAME ']));
        const event = normalizeText(pick(row, ['event', 'EVENT', 'Event', 'อีเว้น', 'เหตุการณ์']));
        const customerPo = normalizeText(pick(row, ['customerPo', 'customer_po', 'PO', 'PO NO', 'PO NO.', 'Customer PO', 'customer po', 'PO:', 'เลข PO', 'PO NO.']));
        const dueDate = normalizeDueDate(pick(row, ['dueDate', 'due_date', 'DUE DATE', 'Due Date', 'due date', 'กำหนดส่ง', 'DUE']));
        const quantityRaw = pick(row, ['quantity', 'QTY', 'qty', 'Quantity', 'จำนวน']);
        const quantity = Number(String(quantityRaw ?? '').replace(/[^0-9.-]/g, '')) || 0;

        const myobNumber = normalizeText(pick(row, ['myobNumber', 'myob_number', 'MYOB', 'MYOB NO', 'MYOB NO.', 'MYOB NUMBER', 'MYOB NUMBER ']));
        const countryOfOrigin = normalizeText(pick(row, ['countryOfOrigin', 'country_of_origin', 'Country', 'COUNTRY', 'ประเทศ']));
        const sampleRequestSheet = normalizeText(pick(row, ['sampleRequestSheet', 'sample_request_sheet', 'SAMPLE REQUEST SHEET', 'Sample Request Sheet', 'เอกสารขอชิ้นงาน']));
        const revisionLevel = normalizeText(pick(row, ['revisionLevel', 'revision_level', 'REV LEVEL', 'REV LEVEL.', 'REV', 'rev']));
        const revisionNumber = normalizeText(pick(row, ['revisionNumber', 'revision_number', 'REV NO', 'REV NO.', 'REVISION', 'revision']));

        const isDeliveredRaw = pick(row, ['isDelivered', 'is_delivered', 'DELIVERED', 'Delivered', 'ส่งแล้ว']);
        const isDelivered =
          String(isDeliveredRaw ?? '').toLowerCase() === 'true' ||
          String(isDeliveredRaw ?? '').toLowerCase() === 'yes' ||
          String(isDeliveredRaw ?? '').toLowerCase() === 'y' ||
          String(isDeliveredRaw ?? '').toLowerCase() === 'ส่งแล้ว' ||
          String(isDeliveredRaw ?? '') === '1';

        const deliveredAtRaw = pick(row, ['deliveredAt', 'delivered_at', 'DELIVERED AT', 'Delivered At', 'วันที่ส่ง']);
        const deliveredAt = deliveredAtRaw ? normalizeDueDate(deliveredAtRaw) : null;

        const record: DueRecordInput = {
          deliveryType: normalizedType ?? '',
          myobNumber,
          customer,
          countryOfOrigin,
          sampleRequestSheet,
          model,
          partNumber,
          partName,
          revisionLevel,
          revisionNumber,
          event,
          customerPo,
          quantity,
          dueDate,
          isDelivered,
          deliveredAt,
        };

        const missingFields: string[] = [];
        if (!record.deliveryType) missingFields.push('deliveryType');
        if (!record.customer) missingFields.push('customer');
        if (!record.model) missingFields.push('model');
        if (!record.partNumber) missingFields.push('partNumber');
        if (!record.partName) missingFields.push('partName');
        if (!record.event) missingFields.push('event');
        if (!record.customerPo) missingFields.push('customerPo');
        if (!record.dueDate) missingFields.push('dueDate');

        if (missingFields.length > 0) {
          skipped++;
          const key = missingFields.join(',');
          skippedMissingCounts[key] = (skippedMissingCounts[key] ?? 0) + 1;
          if (skippedSamples.length < 20) {
            skippedSamples.push({ sheet: sheetName, row: rowNumber, missing: missingFields });
          }
          continue;
        }

        parsedRows++;

        const dedupeKey = computeDedupeKey(record);
        try {
          const deliveredAtDate =
            record.deliveredAt === null || record.deliveredAt === undefined || record.deliveredAt === ''
              ? null
              : new Date(record.deliveredAt);

          await prisma.dueRecord.upsert({
            where: { dedupeKey },
            create: {
              dedupeKey,
              deliveryType: record.deliveryType ?? '',
              myobNumber: record.myobNumber ?? '',
              customer: record.customer ?? '',
              countryOfOrigin: record.countryOfOrigin ?? '',
              sampleRequestSheet: record.sampleRequestSheet ?? '',
              model: record.model ?? '',
              partNumber: record.partNumber ?? '',
              partName: record.partName ?? '',
              revisionLevel: record.revisionLevel ?? '',
              revisionNumber: record.revisionNumber ?? '',
              event: record.event ?? '',
              customerPo: record.customerPo ?? '',
              quantity: Number(record.quantity) || 0,
              dueDate: record.dueDate ?? '',
              isDelivered: Boolean(record.isDelivered),
              deliveredAt: deliveredAtDate,
            },
            update: {
              deliveryType: record.deliveryType ?? '',
              myobNumber: record.myobNumber ?? '',
              customer: record.customer ?? '',
              countryOfOrigin: record.countryOfOrigin ?? '',
              sampleRequestSheet: record.sampleRequestSheet ?? '',
              model: record.model ?? '',
              partNumber: record.partNumber ?? '',
              partName: record.partName ?? '',
              revisionLevel: record.revisionLevel ?? '',
              revisionNumber: record.revisionNumber ?? '',
              event: record.event ?? '',
              customerPo: record.customerPo ?? '',
              quantity: Number(record.quantity) || 0,
              dueDate: record.dueDate ?? '',
              isDelivered: Boolean(record.isDelivered),
              deliveredAt: deliveredAtDate,
            },
          });

          upserted++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          errors.push({ sheet: sheetName, row: rowNumber, message: msg });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      totalRows,
      parsedRows,
      upserted,
      skipped,
      skippedMissingCounts,
      skippedSamples,
      errorsCount: errors.length,
      errors: errors.slice(0, 50),
    });
  } catch (error) {
    console.error('Error importing due records:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to import due records', details },
      { status: 500 }
    );
  }
}
