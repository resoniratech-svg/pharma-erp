const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const groups = [
    { name: 'Bank Accounts', nature: 'Asset' },
    { name: 'Cash-in-hand', nature: 'Asset' },
    { name: 'Sundry Debtors', nature: 'Asset' },
    { name: 'Sundry Creditors', nature: 'Liability' },
    { name: 'Fixed Assets', nature: 'Asset' },
    { name: 'Direct Income', nature: 'Income' },
    { name: 'Indirect Income', nature: 'Income' },
    { name: 'Direct Expenses', nature: 'Expense' },
    { name: 'Indirect Expenses', nature: 'Expense' },
    { name: 'Capital Account', nature: 'Equity' },
    { name: 'Duties & Taxes', nature: 'Liability' },
    { name: 'Current Liabilities', nature: 'Liability' },
    { name: 'Loans & Advances (Asset)', nature: 'Asset' },
    { name: 'Unsecured Loans', nature: 'Liability' },
    { name: 'Secured Loans', nature: 'Liability' }
  ];

  for (const group of groups) {
    await prisma.accountGroup.create({ data: group });
  }
  console.log('Account groups seeded!');
}

seed().catch(e => console.error(e)).finally(() => prisma.$disconnect());
