const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const companies = await prisma.company.findMany();
  console.log("Companies:", companies);
  const users = await prisma.user.findMany({ select: { id: true, email: true, companyId: true, role: true } });
  console.log("Users:", users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
