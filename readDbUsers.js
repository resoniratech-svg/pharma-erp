const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      include: {
        mr: true
      }
    });
    console.log('--- Users ---');
    console.log(JSON.stringify(users, null, 2));

    const mrs = await prisma.mR.findMany();
    console.log('--- MRs ---');
    console.log(JSON.stringify(mrs, null, 2));

    const expenses = await prisma.expenseClaim.findMany();
    console.log('--- Expenses ---');
    console.log(JSON.stringify(expenses, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
