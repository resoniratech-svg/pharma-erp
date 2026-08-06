const prisma = require("../../config/db");
const bcrypt = require("bcrypt");

const createCompanyWithAdmin = async (data) => {
  const adminEmail = (data.adminEmail || data.email || "").trim().toLowerCase();
  const companyName = (data.companyName || data.name || "").trim();
  const adminName = (data.adminName || data.contactPerson || companyName || "Company Admin").trim();
  const plainPassword = data.adminPassword || data.password || "Admin@123";

  // Check if admin user email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    throw new Error(`A user with email "${adminEmail}" already exists.`);
  }

  // Hash the password for secure authentication
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 1. Create Company in PostgreSQL
  const company = await prisma.company.create({
    data: {
      name: companyName,
      email: data.companyEmail || adminEmail,
      phone: data.companyPhone || data.phone || null,
      address: data.address || null,
      isActive: true,
    },
  });

  // 2. Create Company Admin User in PostgreSQL linked to the Company
  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      companyId: company.id,
      isActive: true,
    },
  });

  return {
    company,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      companyId: admin.companyId,
      createdAt: admin.createdAt,
    },
  };
};

const getAllCompanies = async () => {
  return prisma.company.findMany({
    where: { isActive: true },
    include: {
      users: {
        where: {
          role: { in: ["ADMIN", "SUPER_ADMIN"] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
    orderBy: { id: "desc" },
  });
};

const deleteCompany = async (id) => {
  const companyId = Number(id);
  // Delete associated users for this company first
  await prisma.user.deleteMany({
    where: { companyId },
  });

  // Delete company permissions if any
  await prisma.companyFeaturePermission.deleteMany({
    where: { companyId },
  });

  // Delete company record
  return prisma.company.delete({
    where: { id: companyId },
  });
};

const getCompanyFeatures = async (companyId) => {
  return prisma.companyFeaturePermission.findMany({
    where: {
      companyId,
    },
    include: {
      feature: true,
    },
  });
};

module.exports = {
  createCompanyWithAdmin,
  getAllCompanies,
  deleteCompany,
  getCompanyFeatures,
};