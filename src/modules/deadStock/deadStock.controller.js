const service = require("./deadStock.service");

const getDeadStock = async (req, res) => {
  try {
    const data =
      await service.getDeadStockService();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDeadStock,
};