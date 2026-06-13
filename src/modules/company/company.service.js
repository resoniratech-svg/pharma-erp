const {
  createCompanyWithAdmin,
} = require("./company.repository");

const createCompany = async (data) => {
  return createCompanyWithAdmin(data);
};

module.exports = {
  createCompany,
};

const prisma = require("../../config/db");

const getCompanyFeatures = async (
  companyId
) => {
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
  createCompany,
  getCompanyFeatures,
};