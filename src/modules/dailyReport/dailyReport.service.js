const repo = require("./dailyReport.repository");

module.exports = {
  createDailyReportService: repo.createDailyReportRepo,
  getAllDailyReportsService: repo.getAllDailyReportsRepo,
  getDailyReportByIdService: repo.getDailyReportByIdRepo,
  updateDailyReportService: repo.updateDailyReportRepo,
  deleteDailyReportService: repo.deleteDailyReportRepo,
  getDailyReportsByMrService: repo.getDailyReportsByMrRepo,
  getDailyReportsByDateService: repo.getDailyReportsByDateRepo,
};