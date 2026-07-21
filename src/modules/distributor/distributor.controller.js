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

const createDistributor = async (req, res) => {
  try {
    const result = await service.createDistributorService(req.body);
    res.status(201).json({
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

const updateDistributor = async (req, res) => {
  try {
    const result = await service.updateDistributorService(req.params.id, req.body);
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
  getDistributors,
  createDistributor,
  updateDistributor,
};
