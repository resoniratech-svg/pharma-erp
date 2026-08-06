const service = require("./targetAllocation.service");

// --- National Target Controllers ---

const createNationalTarget = async (req, res) => {
  try {
    const result = await service.createNationalTargetService(req.body, req.user);
    res.status(201).json({
      success: true,
      data: result,
      message: "National target created successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getNationalTargets = async (req, res) => {
  try {
    const result = await service.getNationalTargetsService(req.query);
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

const getNationalTargetById = async (req, res) => {
  try {
    const result = await service.getNationalTargetByIdService(Number(req.params.id));
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

const updateNationalTarget = async (req, res) => {
  try {
    const result = await service.updateNationalTargetService(
      Number(req.params.id),
      req.body
    );
    res.status(200).json({
      success: true,
      data: result,
      message: "National target updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// --- Target Allocation Controllers ---

const allocateTarget = async (req, res) => {
  try {
    const result = await service.allocateTargetService(req.body, req.user);
    res.status(201).json({
      success: true,
      data: result,
      message: "Target allocated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getTargetAllocations = async (req, res) => {
  try {
    const result = await service.getTargetAllocationsService(req.query);
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

const getTargetAllocationById = async (req, res) => {
  try {
    const result = await service.getTargetAllocationByIdService(Number(req.params.id));
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

const getNationalTargetSummary = async (req, res) => {
  try {
    const fy = req.query.financialYear || "2026-27";
    const result = await service.getNationalTargetSummaryService(fy);
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

const getRSMTargetSummary = async (req, res) => {
  try {
    const employeeId = req.query.employeeId || (req.user && req.user.employeeId);
    const fy = req.query.financialYear || "2026-27";
    const result = await service.getRSMTargetSummaryService(employeeId, fy);
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

const getASMTargetSummary = async (req, res) => {
  try {
    const employeeId = req.query.employeeId || (req.user && req.user.employeeId);
    const fy = req.query.financialYear || "2026-27";
    const result = await service.getASMTargetSummaryService(employeeId, fy);
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

const updateTargetAllocation = async (req, res) => {
  try {
    const result = await service.updateTargetAllocationService(
      Number(req.params.id),
      req.body
    );
    res.status(200).json({
      success: true,
      data: result,
      message: "Target allocation updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteTargetAllocation = async (req, res) => {
  try {
    await service.deleteTargetAllocationService(Number(req.params.id));
    res.status(200).json({
      success: true,
      message: "Target allocation deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createNationalTarget,
  getNationalTargets,
  getNationalTargetById,
  updateNationalTarget,
  allocateTarget,
  getTargetAllocations,
  getTargetAllocationById,
  getNationalTargetSummary,
  getRSMTargetSummary,
  getASMTargetSummary,
  updateTargetAllocation,
  deleteTargetAllocation,
};
