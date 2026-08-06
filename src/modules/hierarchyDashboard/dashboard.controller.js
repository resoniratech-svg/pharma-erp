const service = require("./dashboard.service");

const getNSMDashboard = async (req, res) => {
  try {
    const fy = req.query.financialYear || "2026-27";
    const result = await service.getNSMDashboardKPIs(fy);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getRSMDashboard = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const employeeId = req.query.employeeId || null;
    const fy = req.query.financialYear || "2026-27";
    const result = await service.getRSMDashboardKPIs(userId, employeeId, fy);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getASMDashboard = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const employeeId = req.query.employeeId || null;
    const fy = req.query.financialYear || "2026-27";
    const result = await service.getASMDashboardKPIs(userId, employeeId, fy);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMRDashboard = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const employeeId = req.query.employeeId || null;
    const fy = req.query.financialYear || "2026-27";
    const result = await service.getMRDashboardKPIs(userId, employeeId, fy);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getNSMDashboard,
  getRSMDashboard,
  getASMDashboard,
  getMRDashboard,
};
