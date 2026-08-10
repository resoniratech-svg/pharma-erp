const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const groups = [
    { name: 'Bank Accounts', nature: 'Asset' },
    { name: 'Sundry Debtors', nature: 'Asset' },
    { name: 'Sundry Creditors', nature: 'Liability' },
    { name: 'Direct Income', nature: 'Income' },
    { name: 'Indirect Expenses', nature: 'Expense' }
  ];

  for (const group of groups) {
    const existing = await prisma.accountGroup.findFirst({ where: { name: group.name }});
    if (!existing) {
      await prisma.accountGroup.create({ data: group });
    }
  }
  console.log('Account groups seeded!');
}

seed().catch(e => console.error(e)).finally(() => prisma.$disconnect());
