const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: '.env' });
} catch (_) {
  // ignore
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function toDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  const inputFile = path.join(__dirname, 'missing-stockitems.json');
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Missing file not found: ${inputFile}. Run find-missing-stockitems.js first.`);
  }

  const payload = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const items = Array.isArray(payload.items) ? payload.items : [];

  console.log(`Missing items to insert: ${items.length}`);
  if (items.length === 0) return;

  let inserted = 0;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    try {
      await prisma.stockItem.create({
        data: {
          myobNumber: item.myobNumber || '',
          model: item.model || '',
          partName: item.partName || '',
          partNumber: item.partNumber || '',
          revision: item.revision || '',
          poNumber: item.poNumber || '',
          receivedQty: Number.isFinite(item.receivedQty) ? item.receivedQty : Number.parseInt(String(item.receivedQty || 0), 10) || 0,
          receivedDate: toDateOrNull(item.receivedDate) || new Date(0),
          supplier: item.supplier ?? null,
          customer: item.customer ?? null,
          issuedQty: item.issuedQty === null || item.issuedQty === undefined ? null : Number.parseInt(String(item.issuedQty), 10),
          invoiceNumber: item.invoiceNumber ?? null,
          issueDate: toDateOrNull(item.issueDate),
          dueDate: toDateOrNull(item.dueDate),
          event: item.event ?? null,
          withdrawalNumber: item.withdrawalNumber ?? null,
          remarks: item.remarks ?? null,
        },
      });
      inserted += 1;
    } catch (err) {
      console.log(`Skip/Fail at ${i + 1}/${items.length}: ${err?.message || err}`);
    }

    if ((i + 1) % 25 === 0 || i + 1 === items.length) {
      console.log(`Progress: ${i + 1}/${items.length} | inserted=${inserted}`);
    }
  }

  console.log(`Done. Inserted: ${inserted}/${items.length}`);
}

main()
  .catch((err) => {
    console.error('ERROR:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
