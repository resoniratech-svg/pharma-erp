const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dispatches = await prisma.dispatch.findMany({
    where: {
      dispatchNo: { in: ['OUT-2026-005', 'OUT-2026-007'] }
    }
  });

  for (const d of dispatches) {
    console.log(`\n=== Dispatch ${d.dispatchNo} ===`);
    console.log("Customer:", d.customerName);
    console.log("Products JSON:", JSON.stringify(d.products, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
