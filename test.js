const prisma = require('./src/config/db');
async function main() {
  const s = await prisma.supplier.findFirst();
  const w = await prisma.warehouse.findFirst();
  console.log('Supplier:', s);
  console.log('Warehouse:', w);
}
main().finally(() => prisma.$disconnect());
