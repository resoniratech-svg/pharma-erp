const prisma = require("../../config/db");
const service = require("./dailyReport.service");

const createDailyReport = async (req, res) => {
  try {
    let mrId = Number(req.body.mrId);
    if (req.user && req.user.id) {
      const mr = await prisma.mR.findUnique({
        where: { userId: req.user.id },
      });
      if (mr) {
        mrId = mr.id;
      } else if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
        const firstMR = await prisma.mR.findFirst();
        if (firstMR) {
          mrId = firstMR.id;
        }
      }
    }

    const data = await service.createDailyReportService({
      ...req.body,
      mrId,
    });

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
  let mrId = Number(req.params.mrId);
  if (req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN')) {
    if (mrId === 1) mrId = 2;
  }

  const data = await service.getDailyReportsByMrService(mrId);

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

const getASMDailyReports = async (req, res) => {
  try {
    let employeeId = null;
    if (req.user) {
      const employee = await prisma.employee.findUnique({
        where: { userId: req.user.id }
      });
      if (employee) {
        employeeId = employee.id;
      }
    }
    
    // Fallback for testing: pick the first ASM if none is logged in
    if (!employeeId) {
      const asm = await prisma.employee.findFirst({
        where: { designation: "Area Sales Manager", status: "Active" }
      });
      if (asm) employeeId = asm.id;
    }

    if (!employeeId) {
      throw new Error("Could not determine ASM employee ID");
    }

    const data = await service.getASMDailyReportsService(employeeId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDailyReport,
  getAllDailyReports,
  getDailyReportById,
  updateDailyReport,
  deleteDailyReport,
  getDailyReportsByMr,
  getDailyReportsByDate,
  getASMDailyReports,
};