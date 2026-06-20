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
  getLeadAnalytics,
  getExpenseAnalytics,
  getLeaveAnalytics,
  getMrPerformance,
};