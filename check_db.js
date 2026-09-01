const prisma = require('./src/config/db');
async function check() {
  const users = await prisma.user.findMany();
  const emps = await prisma.employee.findMany();
  console.log("Users:", JSON.stringify(users, null, 2));
  console.log("Employees:", JSON.stringify(emps, null, 2));
}
check().finally(() => prisma.$disconnect());
