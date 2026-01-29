const { PrismaClient } = require('@prisma/client');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });
  require('dotenv').config({ path: path.join(__dirname, '../.env.local'), override: true });
} catch {
  // ignore
}

function safeUrlInfo(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol,
      host: url.hostname,
      port: url.port,
      username: url.username,
      database: url.pathname.replace('/', ''),
      search: url.search,
    };
  } catch {
    return { invalid: true };
  }
}

async function main() {
  console.log(
    JSON.stringify(
      {
        DATABASE_URL: safeUrlInfo(process.env.DATABASE_URL),
        DIRECT_URL: safeUrlInfo(process.env.DIRECT_URL),
      },
      null,
      2
    )
  );

  const prisma = new PrismaClient();
  try {
    const stockItems = await prisma.stockItem.count();
    const transactions = await prisma.transaction.count();

    let ngItems = 0;
    try {
      ngItems = await prisma.nGItem.count();
    } catch {
      ngItems = 0;
    }

    let dueRecords = 0;
    try {
      dueRecords = await prisma.dueRecord.count();
    } catch {
      dueRecords = 0;
    }

    console.log(JSON.stringify({ stockItems, transactions, ngItems, dueRecords }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
