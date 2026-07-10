const service = require("./analytics.service");

const getDashboardAnalytics =
  async (req, res) => {
    const data =
      await service.getDashboardAnalyticsService();

    res.json({
      success: true,
      data,
    });
  };

const getMrDashboardAnalytics = async (req, res) => {
  try {
    const data = await service.getMrDashboardAnalyticsService(Number(req.params.mrId));
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

const getLeadAnalytics =
  async (req, res) => {
    const data =
      await service.getLeadAnalyticsService();

    res.json({
      success: true,
      data,
    });
  };

const getExpenseAnalytics =
  async (req, res) => {
    const data =
      await service.getExpenseAnalyticsService();

    res.json({
      success: true,
      data,
    });
  };

const getLeaveAnalytics =
  async (req, res) => {
    const data =
      await service.getLeaveAnalyticsService();

    res.json({
      success: true,
      data,
    });
  };

const getMrPerformance =
  async (req, res) => {
    const data =
      await service.getMrPerformanceService();

    res.json({
      success: true,
      data,
    });
  };

module.exports = {
  getDashboardAnalytics,
  getMrDashboardAnalytics,
  getLeadAnalytics,
  getExpenseAnalytics,
  getLeaveAnalytics,
  getMrPerformance,
};