const {
  getModules,
} = require("./module.service");

const getAllModules = async (req, res) => {
  try {
    const modules = await getModules();

    res.status(200).json({
      success: true,
      data: modules,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllModules,
};