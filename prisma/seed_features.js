const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding core features for production...");
  
  // 1. Create a Core Module if it doesn't exist
  const module = await prisma.module.upsert({
    where: { name: "Core System" },
    update: {},
    create: {
      name: "Core System",
      description: "Core modules and features",
    }
  });

  const featuresToEnable = [
    "Product Master Management",
    "Batch Management",
    "Inventory Management",
    "Test Feature"
  ];

  for (const featureName of featuresToEnable) {
    // Ensure the feature exists
    const feature = await prisma.feature.upsert({
      where: { name: featureName },
      update: {},
      create: {
        name: featureName,
        description: `Access to ${featureName}`,
        moduleId: module.id
      }
    });

    // Enable for company 1
    await prisma.companyFeaturePermission.upsert({
      where: {
        companyId_featureId: {
          companyId: 1,
          featureId: feature.id
        }
      },
      update: {
        enabled: true
      },
      create: {
        companyId: 1,
        featureId: feature.id,
        enabled: true
      }
    });
    
    console.log(`Enabled feature: ${featureName} for Company 1`);
  }

  console.log("Finished seeding features.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
