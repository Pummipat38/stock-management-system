import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.stockItem.createMany({
    data: [
      {
        myobNumber: 'MYOB001',
        model: 'Model A-100',
        partName: 'Bearing Assembly',
        partNumber: 'BRG-001-A',
        revision: 'Rev A',
        poNumber: 'PO-2024-001',
        receivedQty: 100,
        receivedDate: new Date('2024-09-01'),
        issuedQty: 20,
        invoiceNumber: 'INV-2024-001',
        issueDate: new Date('2024-09-05'),
        dueDate: new Date('2024-10-05'),
        remarks: 'สินค้าคุณภาพดี ใช้สำหรับเครื่องจักรหลัก',
      },
      {
        myobNumber: 'MYOB002',
        model: 'Model B-200',
        partName: 'Motor Shaft',
        partNumber: 'SFT-002-B',
        revision: 'Rev B',
        poNumber: 'PO-2024-002',
        receivedQty: 50,
        receivedDate: new Date('2024-09-02'),
        issuedQty: 10,
        invoiceNumber: 'INV-2024-002',
        issueDate: new Date('2024-09-10'),
        dueDate: new Date('2024-10-10'),
        remarks: 'สำหรับงาน Assembly Line 2',
      },
      {
        myobNumber: 'MYOB003',
        model: 'Model C-300',
        partName: 'Control Panel',
        partNumber: 'CTL-003-C',
        revision: 'Rev C',
        poNumber: 'PO-2024-003',
        receivedQty: 25,
        receivedDate: new Date('2024-09-03'),
        remarks: 'ยังไม่ได้จ่ายออก รอการติดตั้ง',
      },
    ],
  });

  console.log('✅ Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
