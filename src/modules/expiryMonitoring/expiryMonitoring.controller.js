const service = require("./expiryMonitoring.service");

const getExpiringBatches = async (req, res) => {
  try {
    const data =
      await service.getExpiringBatchesService();

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
  getExpiringBatches,
};