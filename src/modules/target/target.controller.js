const service = require("./target.service");

const createTarget = async (req, res) => {
  try {
    const data =
      await service.createTargetService(
        req.body
      );

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

const getAllTargets = async (req, res) => {
  const data =
    await service.getAllTargetsService();

  res.json({
    success: true,
    data,
  });
};

const getTargetById = async (req, res) => {
  const data =
    await service.getTargetByIdService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const updateTarget = async (req, res) => {
  const data =
    await service.updateTargetService(
      req.params.id,
      req.body
    );

  res.json({
    success: true,
    data,
  });
};

const deleteTarget = async (req, res) => {
  await service.deleteTargetService(
    req.params.id
  );

  res.json({
    success: true,
    message:
      "Target deleted successfully",
  });
};

const getTargetsByMr = async (
  req,
  res
) => {
  const data =
    await service.getTargetsByMrService(
      req.params.mrId
    );

  res.json({
    success: true,
    data,
  });
};

const getTargetsByMonth = async (
  req,
  res
) => {
  const data =
    await service.getTargetsByMonthService(
      req.params.month,
      req.params.year
    );

  res.json({
    success: true,
    data,
  });
};

module.exports = {
  createTarget,
  getAllTargets,
  getTargetById,
  updateTarget,
  deleteTarget,
  getTargetsByMr,
  getTargetsByMonth,
};