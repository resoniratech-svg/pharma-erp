const prisma = require("../../config/db");

const createCompanyWithAdmin = async (data) => {
  const company = await prisma.company.create({
    data: {
      name: data.companyName,
      email: data.companyEmail,
      phone: data.companyPhone,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: data.adminName,
      email: data.adminEmail,
      password: data.adminPassword, // we'll hash later
      role: "ADMIN",
      companyId: company.id,
    },
  });

  return {
    company,
    admin,
  };
};

module.exports = {
  createCompanyWithAdmin,
};