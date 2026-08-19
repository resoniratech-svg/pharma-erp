const {
  createCompany,
  getAllCompanies,
  deleteCompany,
  getCompanyFeatures,
} = require("./company.service");

const getAll = async (req, res) => {
  try {
    const companies = await getAllCompanies();
    res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const create = async (req, res) => {
  try {
    const result = await createCompany(req.body);

    res.status(201).json({
      success: true,
      message: "Company and Admin created successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    const companyId = Number(req.params.id);
    await deleteCompany(companyId);

    res.status(200).json({
      success: true,
      message: "Company and associated admin deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getFeatures = async (req, res) => {
  try {
    const companyId = Number(req.params.id);
    const features = await getCompanyFeatures(companyId);

    res.status(200).json({
      success: true,
      data: features,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateSubscription = async (req, res) => {
  try {
    const companyId = Number(req.params.id);
    const { updateCompanySubscription } = require('./company.service');
    const result = await updateCompanySubscription(companyId, req.body);
    res.status(200).json({
      success: true,
      data: result,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  getAll,
  create,
  remove,
  getFeatures,
  updateSubscription,
};