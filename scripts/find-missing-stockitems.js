// NOTE: This script compares the backup file (892 records) with current Supabase data and finds which records are missing.
// It treats records as a multiset: if the same record appears N times in backup but M times in Supabase, it reports (N-M) missing.

const fs = require('fs');
const path = require('path');

try {
  // Optional: load .env if dotenv is installed
  // eslint-disable-next-line global-require
  require('dotenv').config({ path: '.env' });
} catch (_) {
  // ignore
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function toIsoOrEmpty(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function toIntOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number.parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

function toIntOrZero(value) {
  const n = toIntOrNull(value);
  return n === null ? 0 : n;
}

function normalizeString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function signatureFromItem(item) {
  // Signature excludes id/createdAt/updatedAt.
  // Keep it aligned with the "exact duplicate" criteria we used when deleting duplicates.
  return [
    normalizeString(item.myobNumber),
    normalizeString(item.model),
    normalizeString(item.partName),
    normalizeString(item.partNumber),
    normalizeString(item.revision),
    normalizeString(item.poNumber),
    String(toIntOrZero(item.receivedQty)),
    toIsoOrEmpty(item.receivedDate),
    normalizeString(item.supplier),
    normalizeString(item.customer),
    item.issuedQty === null || item.issuedQty === undefined ? '' : String(toIntOrNull(item.issuedQty) ?? ''),
    normalizeString(item.invoiceNumber),
    toIsoOrEmpty(item.issueDate),
    toIsoOrEmpty(item.dueDate),
    normalizeString(item.event),
    normalizeString(item.withdrawalNumber),
    normalizeString(item.remarks),
  ].join('|');
}

function coerceBackupItem(raw) {
  return {
    myobNumber: normalizeString(raw.myobNumber),
    model: normalizeString(raw.model),
    partName: normalizeString(raw.partName),
    partNumber: normalizeString(raw.partNumber),
    revision: normalizeString(raw.revision),
    poNumber: normalizeString(raw.poNumber),
    receivedQty: toIntOrZero(raw.receivedQty),
    receivedDate: new Date(raw.receivedDate),
    supplier: raw.supplier ? normalizeString(raw.supplier) : null,
    customer: raw.customer ? normalizeString(raw.customer) : null,
    issuedQty: raw.issuedQty === null || raw.issuedQty === undefined || raw.issuedQty === '' ? null : toIntOrNull(raw.issuedQty),
    invoiceNumber: raw.invoiceNumber ? normalizeString(raw.invoiceNumber) : null,
    issueDate: raw.issueDate ? new Date(raw.issueDate) : null,
    dueDate: raw.dueDate ? new Date(raw.dueDate) : null,
    event: raw.event ? normalizeString(raw.event) : null,
    withdrawalNumber: raw.withdrawalNumber ? normalizeString(raw.withdrawalNumber) : null,
    remarks: raw.remarks ? normalizeString(raw.remarks) : null,
  };
}

function coerceSupabaseItem(row) {
  return {
    myobNumber: normalizeString(row.myobNumber),
    model: normalizeString(row.model),
    partName: normalizeString(row.partName),
    partNumber: normalizeString(row.partNumber),
    revision: normalizeString(row.revision),
    poNumber: normalizeString(row.poNumber),
    receivedQty: toIntOrZero(row.receivedQty),
    receivedDate: row.receivedDate,
    supplier: row.supplier ? normalizeString(row.supplier) : null,
    customer: row.customer ? normalizeString(row.customer) : null,
    issuedQty: row.issuedQty === null || row.issuedQty === undefined ? null : toIntOrNull(row.issuedQty),
    invoiceNumber: row.invoiceNumber ? normalizeString(row.invoiceNumber) : null,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    event: row.event ? normalizeString(row.event) : null,
    withdrawalNumber: row.withdrawalNumber ? normalizeString(row.withdrawalNumber) : null,
    remarks: row.remarks ? normalizeString(row.remarks) : null,
  };
}

function incrementCount(map, sig, sample) {
  const current = map.get(sig);
  if (!current) {
    map.set(sig, { count: 1, sample });
  } else {
    current.count += 1;
  }
}

async function main() {
  const backupFile =
    process.env.BACKUP_FILE ||
    'D:\\stock-backups\\stock-backup-2026-01-20T07-21-58-221Z.json';

  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }

  const rawBackup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  const backupArray = Array.isArray(rawBackup)
    ? rawBackup
    : Array.isArray(rawBackup.data)
      ? rawBackup.data
      : [];

  console.log(`Backup file: ${backupFile}`);
  console.log(`Backup records: ${backupArray.length}`);

  console.log('Fetching current data from Supabase via Prisma...');
  const rows = await prisma.stockItem.findMany({
    select: {
      myobNumber: true,
      model: true,
      partName: true,
      partNumber: true,
      revision: true,
      poNumber: true,
      receivedQty: true,
      receivedDate: true,
      supplier: true,
      customer: true,
      issuedQty: true,
      invoiceNumber: true,
      issueDate: true,
      dueDate: true,
      event: true,
      withdrawalNumber: true,
      remarks: true,
    },
  });

  console.log(`Supabase current rows: ${rows.length}`);

  const backupCounts = new Map();
  for (const raw of backupArray) {
    const item = coerceBackupItem(raw);
    const sig = signatureFromItem(item);
    incrementCount(backupCounts, sig, item);
  }

  const supabaseCounts = new Map();
  for (const row of rows) {
    const item = coerceSupabaseItem(row);
    const sig = signatureFromItem(item);
    incrementCount(supabaseCounts, sig, item);
  }

  const missingGroups = [];
  const missingItems = [];

  for (const [sig, b] of backupCounts.entries()) {
    const s = supabaseCounts.get(sig);
    const supCount = s ? s.count : 0;
    const missingCount = b.count - supCount;
    if (missingCount > 0) {
      missingGroups.push({
        signature: sig,
        backupCount: b.count,
        supabaseCount: supCount,
        missingCount,
        sample: {
          partNumber: b.sample.partNumber,
          poNumber: b.sample.poNumber,
          receivedDate: b.sample.receivedDate ? b.sample.receivedDate.toISOString() : null,
          receivedQty: b.sample.receivedQty,
        },
      });

      for (let i = 0; i < missingCount; i += 1) {
        missingItems.push(b.sample);
      }
    }
  }

  const result = {
    generatedAt: new Date().toISOString(),
    backupFile,
    backupRecords: backupArray.length,
    supabaseRows: rows.length,
    totalMissingRecords: missingItems.length,
    missingGroupsCount: missingGroups.length,
    missingGroups: missingGroups.sort((a, b) => b.missingCount - a.missingCount).slice(0, 200),
    items: missingItems,
  };

  const outFile = path.join(__dirname, 'missing-stockitems.json');
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');

  console.log('---');
  console.log(`Total missing (to match backup multiplicity): ${missingItems.length}`);
  console.log(`Wrote: ${outFile}`);

  if (missingItems.length === 0) {
    console.log('No missing records detected by multiset comparison.');
  } else {
    console.log('Next step: run restore-missing-stockitems.js to insert the missing records.');
  }
}

main()
  .catch((err) => {
    console.error('ERROR:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
