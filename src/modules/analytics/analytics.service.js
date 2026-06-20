const repo = require("./analytics.repository");

module.exports = {
  getDashboardAnalyticsService:
    repo.getDashboardAnalyticsRepo,

  getLeadAnalyticsService:
    repo.getLeadAnalyticsRepo,

  getExpenseAnalyticsService:
    repo.getExpenseAnalyticsRepo,

  getLeaveAnalyticsService:
    repo.getLeaveAnalyticsRepo,

  getMrPerformanceService:
    repo.getMrPerformanceRepo,
};