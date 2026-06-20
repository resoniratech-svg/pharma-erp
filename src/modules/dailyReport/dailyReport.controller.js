const service = require("./dailyReport.service");

const createDailyReport = async (req, res) => {
  try {
    const data = await service.createDailyReportService(req.body);

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

const getAllDailyReports = async (req, res) => {
  const data = await service.getAllDailyReportsService();

  res.json({
    success: true,
    data,
  });
};

const getDailyReportById = async (req, res) => {
  const data = await service.getDailyReportByIdService(req.params.id);

  res.json({
    success: true,
    data,
  });
};

const updateDailyReport = async (req, res) => {
  const data = await service.updateDailyReportService(
    req.params.id,
    req.body
  );

  res.json({
    success: true,
    data,
  });
};

const deleteDailyReport = async (req, res) => {
  await service.deleteDailyReportService(req.params.id);

  res.json({
    success: true,
    message: "Daily Report deleted successfully",
  });
};

const getDailyReportsByMr = async (req, res) => {
  const data = await service.getDailyReportsByMrService(
    req.params.mrId
  );

  res.json({
    success: true,
    data,
  });
};

const getDailyReportsByDate = async (req, res) => {
  const data = await service.getDailyReportsByDateService(
    req.params.date
  );

  res.json({
    success: true,
    data,
  });
};

module.exports = {
  createDailyReport,
  getAllDailyReports,
  getDailyReportById,
  updateDailyReport,
  deleteDailyReport,
  getDailyReportsByMr,
  getDailyReportsByDate,
};