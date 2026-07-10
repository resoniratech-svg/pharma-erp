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

  console.log("Seeding distributors...");
  const distributors = [
    { name: 'Metro Pharma Distributors', mobile: '9012345678' },
    { name: 'Sri Balaji Agencies', mobile: '9023456789' },
    { name: 'Venkateshwara Medical Agencies', mobile: '9034567890' }
  ];
  for (const d of distributors) {
    await prisma.distributor.upsert({
      where: { id: distributors.indexOf(d) + 1 },
      update: d,
      create: d
    });
  }

  console.log("Seeding hospitals...");
  const hospitals = [
    { name: 'Yashoda Hospital', mobile: '9123456789', address: 'Secunderabad' },
    { name: 'Apollo Hospitals', mobile: '9234567890', address: 'Jubilee Hills' },
    { name: 'Care Hospital', mobile: '9345678901', address: 'Banjara Hills' },
    { name: 'Sunshine Clinic', mobile: '9456789012', address: 'Gachibowli' }
  ];
  for (const h of hospitals) {
    await prisma.hospital.upsert({
      where: { id: hospitals.indexOf(h) + 1 },
      update: h,
      create: h
    });
  }

  console.log("Seeding territory beats...");
  const territoryBeats = [
    { area: 'Mumbai Central', district: 'Mumbai City', state: 'Maharashtra', totalDoctors: 15, totalChemists: 10 },
    { area: 'Bandra-Khar West', district: 'Mumbai Suburban', state: 'Maharashtra', totalDoctors: 20, totalChemists: 15 },
    { area: 'knr', district: 'Kannur', state: 'Kerala', totalDoctors: 10, totalChemists: 8 },
    { area: 'pune', district: 'Pune', state: 'Maharashtra', totalDoctors: 12, totalChemists: 10 },
    { area: 'delhi', district: 'New Delhi', state: 'Delhi', totalDoctors: 18, totalChemists: 12 }
  ];
  for (const tb of territoryBeats) {
    await prisma.territoryBeat.upsert({
      where: { id: territoryBeats.indexOf(tb) + 1 },
      update: tb,
      create: tb
    });
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
