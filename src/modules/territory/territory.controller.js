const service = require("./territory.service");

const getTerritoryBeats = async (req, res) => {
  try {
    const data = await service.getTerritoryBeatsService();
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
  getTerritoryBeats,
};
