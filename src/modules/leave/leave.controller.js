const service = require("./leave.service");

const createLeave = async (req, res) => {
  try {
    const data =
      await service.createLeaveService(req.body);

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

const getAllLeaves = async (req, res) => {
  const data =
    await service.getAllLeavesService();

  res.json({
    success: true,
    data,
  });
};

const getLeaveById = async (req, res) => {
  const data =
    await service.getLeaveByIdService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const updateLeave = async (req, res) => {
  const data =
    await service.updateLeaveService(
      req.params.id,
      req.body
    );

  res.json({
    success: true,
    data,
  });
};

const deleteLeave = async (req, res) => {
  await service.deleteLeaveService(
    req.params.id
  );

  res.json({
    success: true,
    message:
      "Leave Request deleted successfully",
  });
};

const getLeavesByMr = async (req, res) => {
  const data =
    await service.getLeavesByMrService(
      req.params.mrId
    );

  res.json({
    success: true,
    data,
  });
};

const approveLeave = async (req, res) => {
  const data =
    await service.approveLeaveService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const rejectLeave = async (req, res) => {
  const data =
    await service.rejectLeaveService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

module.exports = {
  createLeave,
  getAllLeaves,
  getLeaveById,
  updateLeave,
  deleteLeave,
  getLeavesByMr,
  approveLeave,
  rejectLeave,
};