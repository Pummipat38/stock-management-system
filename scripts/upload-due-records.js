const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizeText(value) {
  return String(value ?? '').trim();
}

function computeDedupeKey(input) {
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

async function uploadDueRecords() {
  const fileArg = process.argv[2];
  const fallback = 'D:\\stock-backups\\due-records.json';
  const filePath = fileArg || fallback;

  if (!fs.existsSync(filePath)) {
    console.error(`❌ ไม่พบไฟล์: ${filePath}`);
    console.error('👉 ใช้คำสั่ง: node scripts/upload-due-records.js "D:\\path\\to\\due-records.json"');
    process.exit(1);
  }

  console.log('📖 อ่านไฟล์:', filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('❌ ไฟล์ไม่ใช่ JSON ที่ถูกต้อง');
    process.exit(1);
  }

  const records = Array.isArray(parsed) ? parsed : parsed?.dueRecords || parsed?.records || parsed?.data;

  if (!Array.isArray(records)) {
    console.error('❌ ไม่พบ array ของ due records ในไฟล์');
    process.exit(1);
  }

  console.log(`📦 พบ ${records.length} รายการ`);

  let upserted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];

    const deliveryType = normalizeText(r.deliveryType);
    const customer = normalizeText(r.customer);
    const model = normalizeText(r.model);
    const partNumber = normalizeText(r.partNumber);
    const partName = normalizeText(r.partName);
    const event = normalizeText(r.event);
    const customerPo = normalizeText(r.customerPo);
    const dueDate = normalizeText(r.dueDate);
    const quantity = Number(r.quantity) || 0;

    if (!deliveryType || !customer || !model || !partNumber || !partName || !event || !customerPo || !dueDate) {
      skipped++;
      continue;
    }

    const dedupeKey = computeDedupeKey(r);

    const deliveredAt =
      r.deliveredAt === null || r.deliveredAt === undefined || r.deliveredAt === ''
        ? null
        : new Date(r.deliveredAt);

    try {
      await prisma.dueRecord.upsert({
        where: { dedupeKey },
        create: {
          dedupeKey,
          deliveryType,
          myobNumber: normalizeText(r.myobNumber),
          customer,
          countryOfOrigin: normalizeText(r.countryOfOrigin),
          sampleRequestSheet: normalizeText(r.sampleRequestSheet),
          model,
          partNumber,
          partName,
          revisionLevel: normalizeText(r.revisionLevel),
          revisionNumber: normalizeText(r.revisionNumber),
          event,
          customerPo,
          quantity,
          dueDate,
          isDelivered: Boolean(r.isDelivered),
          deliveredAt,
          ...(r.createdAt ? { createdAt: new Date(r.createdAt) } : {}),
          ...(r.updatedAt ? { updatedAt: new Date(r.updatedAt) } : {}),
        },
        update: {
          deliveryType,
          myobNumber: normalizeText(r.myobNumber),
          customer,
          countryOfOrigin: normalizeText(r.countryOfOrigin),
          sampleRequestSheet: normalizeText(r.sampleRequestSheet),
          model,
          partNumber,
          partName,
          revisionLevel: normalizeText(r.revisionLevel),
          revisionNumber: normalizeText(r.revisionNumber),
          event,
          customerPo,
          quantity,
          dueDate,
          isDelivered: Boolean(r.isDelivered),
          deliveredAt,
        },
      });

      upserted++;
      if (upserted % 25 === 0) {
        console.log(`✅ upsert ไปแล้ว ${upserted}/${records.length}`);
      }
    } catch (err) {
      failed++;
      if (failed < 10) {
        console.error(`❌ ล้มเหลวรายการที่ ${i + 1}:`, err.message || err);
      }
    }
  }

  console.log('\n🎉 เสร็จสิ้น');
  console.log('✅ upserted:', upserted);
  console.log('⚠️ skipped (invalid):', skipped);
  console.log('❌ failed:', failed);
}

uploadDueRecords()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
