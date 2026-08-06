const {
  createCompanyWithAdmin,
  getAllCompanies: repoGetAllCompanies,
  deleteCompany: repoDeleteCompany,
  getCompanyFeatures: repoGetCompanyFeatures,
} = require("./company.repository");

const createCompany = async (data) => {
  return createCompanyWithAdmin(data);
};

const getAllCompanies = async () => {
  return repoGetAllCompanies();
};

const deleteCompany = async (id) => {
  return repoDeleteCompany(id);
};

const getCompanyFeatures = async (companyId) => {
  return repoGetCompanyFeatures(companyId);
};

module.exports = {
  createCompany,
  getAllCompanies,
  deleteCompany,
  getCompanyFeatures,
};