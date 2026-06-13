const prisma = require("../../config/db");

const assignFeatures = async (
  companyId,
  featureIds
) => {

  await prisma.companyFeaturePermission.deleteMany({
    where: {
      companyId,
    },
  });

  const data = featureIds.map(
    (featureId) => ({
      companyId,
      featureId,
      enabled: true,
    })
  );

  return prisma.companyFeaturePermission.createMany({
    data,
  });
};

const getCompanyFeatures = async (
  companyId
) => {
  return prisma.companyFeaturePermission.findMany({
    where: {
      companyId,
      enabled: true,
    },
    include: {
      feature: true,
    },
  });
};

module.exports = {
  assignFeatures,
  getCompanyFeatures,
};