require('dotenv').config();
const prisma = require('./src/config/db');
async function check() {
  const emps = await prisma.employee.findMany();
  console.log(JSON.stringify(emps.slice(-5), null, 2));
}
check().finally(() => { prisma.$disconnect() });
