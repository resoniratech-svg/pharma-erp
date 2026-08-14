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
      drugLicenseNumber: data.drugLicenseNumber || data.dlNumber || null,
      companyPan: data.companyPan || null,
      bankName: data.bankName || null,
      accountName: data.accountName || null,
      accountNumber: data.accountNumber || null,
      ifscCode: data.ifscCode || null,
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
  if (data.drugLicenseNumber !== undefined || data.dlNumber !== undefined) updateData.drugLicenseNumber = data.drugLicenseNumber || data.dlNumber;
  if (data.companyPan !== undefined) updateData.companyPan = data.companyPan;
  if (data.bankName !== undefined) updateData.bankName = data.bankName;
  if (data.accountName !== undefined) updateData.accountName = data.accountName;
  if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber;
  if (data.ifscCode !== undefined) updateData.ifscCode = data.ifscCode;

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
