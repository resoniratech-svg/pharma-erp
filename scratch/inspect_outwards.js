const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.outwardStock.findMany({
    where: {
      dispatchNo: { in: ['OUT-2026-005', 'OUT-2026-007'] }
    },
    include: {
      items: {
        include: {
          product: true,
          batch: true
        }
      }
    }
  });

  for (const r of records) {
    console.log(`\n=== Outward Stock ${r.dispatchNo} ===`);
    console.log("Client:", r.client);
    console.log("Items Count:", r.itemsCount);
    console.log("Items Details:", r.items.map(item => ({
      productId: item.productId,
      productName: item.product?.name,
      batchNo: item.batch?.batchNumber,
      quantity: item.quantity,
      rate: item.rate
    })));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
