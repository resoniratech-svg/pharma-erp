const repo = require("./analytics.repository");

module.exports = {
  getDashboardAnalyticsService:
    repo.getDashboardAnalyticsRepo,

  getMrDashboardAnalyticsService:
    repo.getMrDashboardAnalyticsRepo,

  getLeadAnalyticsService:
    repo.getLeadAnalyticsRepo,

  getExpenseAnalyticsService:
    repo.getExpenseAnalyticsRepo,

  getLeaveAnalyticsService:
    repo.getLeaveAnalyticsRepo,

  getMrPerformanceService:
    repo.getMrPerformanceRepo,

  getProductProfitabilityService:
    repo.getProductProfitabilityRepo,
};