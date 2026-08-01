const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mrs = await prisma.mR.findMany({
    select: {
      name: true,
      mrCode: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });
  console.log(JSON.stringify(mrs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
