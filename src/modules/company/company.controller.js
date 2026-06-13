const {
  createCompany,
  getCompanyFeatures,
} = require("./company.service");

const create = async (req, res) => {
  try {
    const result = await createCompany(req.body);

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: result,
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

    const features =
      await getCompanyFeatures(companyId);

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

module.exports = {
  create,
  getFeatures,
};