const prisma = require("../../config/db");

const assignRolePermissions = async (
  companyId,
  role,
  featureIds
) => {

  return prisma.rolePermission.createMany({
    data: featureIds.map(featureId => ({
      companyId,
      role,
      featureId
    })),
    skipDuplicates: true
  });

};

module.exports = {
  assignRolePermissions
};