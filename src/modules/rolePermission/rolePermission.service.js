const {
  assignRolePermissions
} = require("./rolePermission.repository");

const assignPermissions = async (
  companyId,
  role,
  featureIds
) => {

  return assignRolePermissions(
    companyId,
    role,
    featureIds
  );

};

module.exports = {
  assignPermissions
};