const {
  assignFeatures,
  getCompanyFeatures,
} = require("./permission.repository");

const assignCompanyFeatures = async (
  companyId,
  featureIds
) => {
  return assignFeatures(
    companyId,
    featureIds
  );
};

const getFeaturesByCompany = async (
  companyId
) => {
  return getCompanyFeatures(
    companyId
  );
};

module.exports = {
  assignCompanyFeatures,
  getFeaturesByCompany,
};