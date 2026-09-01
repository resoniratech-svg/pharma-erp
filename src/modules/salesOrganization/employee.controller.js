const service = require("./employee.service");

const createEmployee = async (req, res) => {
  try {
    const data = { ...req.body, creatorUserId: req.user ? req.user.id : null };
    const result = await service.createEmployeeService(data);
    res.status(201).json({
      success: true,
      data: result,
      message: "Employee created successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getEmployees = async (req, res) => {
  try {
    const result = await service.getEmployeesService(req.query);
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

const getEmployeeById = async (req, res) => {
  try {
    const result = await service.getEmployeeByIdService(Number(req.params.id));
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const getSalesOrganizationTree = async (req, res) => {
  try {
    const result = await service.getSalesOrganizationTreeService();
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

const getMyTeam = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;
    const result = await service.getMyTeamService(userId, userRole);
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

const updateEmployee = async (req, res) => {
  try {
    const result = await service.updateEmployeeService(Number(req.params.id), req.body);
    res.status(200).json({
      success: true,
      data: result,
      message: "Employee updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    await service.deleteEmployeeService(Number(req.params.id));
    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  getSalesOrganizationTree,
  getMyTeam,
  updateEmployee,
  deleteEmployee,
};
