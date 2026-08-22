const service = require("./dashboard.service");

const getSuperAdminMetrics = async (req, res) => {
  try {
    const data = await service.getSuperAdminDashboardService();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getSuperAdminMetrics,
};
