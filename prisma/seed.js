const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@gmail.com';
  
  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      }
    });
    console.log('Super Admin user created successfully:', admin);
  } else {
    console.log('Super Admin user already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
