const service = require("./distributor.service");

const getDistributors = async (req, res) => {
  try {
    const data = await service.getDistributorsService();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDistributors,
};
