const prisma = require("../../config/db");

const getDistributorsRepo = async () => {
  return prisma.distributor.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const createDistributorRepo = async (data) => {
  return prisma.distributor.create({
    data: {
      code: data.code,
      name: data.name,
      contactPerson: data.contactPerson || null,
      mobile: data.mobileNumber || data.mobile || null,
      email: data.emailAddress || data.email || null,
      status: data.status || "Active",
    },
  });
};

const updateDistributorRepo = async (id, data) => {
  return prisma.distributor.update({
    where: { id: Number(id) },
    data,
  });
};

module.exports = {
  getDistributorsRepo,
  createDistributorRepo,
  updateDistributorRepo,
};
