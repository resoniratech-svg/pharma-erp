const {
  getFeatures,
} = require("./feature.service");

const getAllFeatures = async (req, res) => {
  try {
    const features = await getFeatures();

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
  getAllFeatures,
};