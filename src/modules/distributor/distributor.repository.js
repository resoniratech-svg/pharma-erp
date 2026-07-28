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
      state: data.state || null,
      status: data.status || "Active",
    },
  });
};

const updateDistributorRepo = async (id, data) => {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
  if (data.mobileNumber !== undefined || data.mobile !== undefined) updateData.mobile = data.mobileNumber || data.mobile;
  if (data.emailAddress !== undefined || data.email !== undefined) updateData.email = data.emailAddress || data.email;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.status !== undefined) updateData.status = data.status;

  return prisma.distributor.update({
    where: { id: Number(id) },
    data: updateData,
  });
};

module.exports = {
  getDistributorsRepo,
  createDistributorRepo,
  updateDistributorRepo,
};
