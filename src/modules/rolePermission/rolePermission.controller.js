const {
  assignPermissions
} = require("./rolePermission.service");

const assign = async (
  req,
  res
) => {

  try {

    const {
      companyId,
      role,
      featureIds
    } = req.body;

    const result =
      await assignPermissions(
        companyId,
        role,
        featureIds
      );

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {

    res.status(400).json({
      success: false,
      message: error.message
    });

  }

};

module.exports = {
  assign
};