const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const users = [
  {
    name: 'System Administrator',
    email: 'superadmin@pharmaerp.com',
    role: 'SUPER_ADMIN',
  },
  {
    name: 'Rahul Sharma',
    email: 'warehouse@pharmaerp.com',
    role: 'WAREHOUSE_MANAGER',
  },
  {
    name: 'Sneha Verma',
    email: 'accounts@pharmaerp.com',
    role: 'ACCOUNTANT',
  },
  {
    name: 'Amit Kumar',
    email: 'distributor@pharmaerp.com',
    role: 'DISTRIBUTOR',
  },
  {
    name: 'Arun Patel',
    email: 'retailer@pharmaerp.com',
    role: 'RETAILER',
  },
  {
    name: 'Priya Reddy',
    email: 'mr@pharmaerp.com',
    role: 'MEDICAL_REPRESENTATIVE',
  },
];

async function main() {
  const hashedPassword = await bcrypt.hash("1234", 10);
  
  console.log("Starting seeding default users...");
  
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        role: userData.role,
        password: hashedPassword,
      },
      create: {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        password: hashedPassword,
      },
    });
    console.log(`Seeded user: ${user.name} (${user.role})`);
  }

  // Also seed the container admin user if not present for mobile deployment
  const adminEmail = 'admin@gmail.com';
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingUser) {
    const adminHashedPassword = await bcrypt.hash('adminpassword', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        password: adminHashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    });
    console.log('Super Admin user created successfully:', admin);
  } else {
    console.log('Super Admin user already exists.');
  }
  
  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
