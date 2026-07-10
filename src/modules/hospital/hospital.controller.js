const service = require("./hospital.service");

const getHospitals = async (req, res) => {
  try {
    const data = await service.getHospitalsService();
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
  getHospitals,
};
