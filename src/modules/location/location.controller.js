const service = require("./location.service");

const getLocations = async (req, res) => {
  try {
    const data = await service.getLocationsService();
    res.json({
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

const createLocation = async (req, res) => {
  try {
    const data = await service.createLocationService(req.body);
    res.status(201).json({
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
  getLocations,
  createLocation
};
