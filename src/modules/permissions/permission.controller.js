const {
  assignCompanyFeatures,
  getFeaturesByCompany,
} = require("./permission.service");

const assign = async (
  req,
  res
) => {
  try {

    const {
      companyId,
      featureIds,
    } = req.body;

    const result =
      await assignCompanyFeatures(
        companyId,
        featureIds
      );

    res.status(200).json({
      success: true,
      message:
        "Features assigned successfully",
      data: result,
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};

const getCompanyPermissions =
  async (req, res) => {

    try {

      const result =
        await getFeaturesByCompany(
          Number(req.params.companyId)
        );

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message,
      });

    }

  };

module.exports = {
  assign,
  getCompanyPermissions,
};