const prisma = require('./config/db');

async function main() {
  const features = await prisma.feature.findMany();
  console.log("Features:", features);
  
  const permissions = await prisma.companyFeaturePermission.findMany({
    include: {
      feature: true
    }
  });
  console.log("Permissions:", permissions);
  
  const user = await prisma.user.findFirst({
    where: { email: 'superadmin@pharmaerp.com' }
  });
  console.log("Super Admin User:", user);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
