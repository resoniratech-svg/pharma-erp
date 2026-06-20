const service = require("./lowStockAlert.service");

const getLowStockProducts = async (req, res) => {
  try {
    const data =
      await service.getLowStockProductsService();

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
  getLowStockProducts,
};