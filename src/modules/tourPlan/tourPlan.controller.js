const service = require("./tourPlan.service");

const createTourPlan = async (req, res) => {
  try {
    const data = await service.createTourPlanService(req.body);

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

const getAllTourPlans = async (req, res) => {
  try {
    const data = await service.getAllTourPlansService();

    res.json({
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

const getTourPlanById = async (req, res) => {
  try {
    const data = await service.getTourPlanByIdService(
      req.params.id
    );

    res.json({
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

const updateTourPlan = async (req, res) => {
  try {
    const data = await service.updateTourPlanService(
      req.params.id,
      req.body
    );

    res.json({
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

const deleteTourPlan = async (req, res) => {
  try {
    await service.deleteTourPlanService(
      req.params.id
    );

    res.json({
      success: true,
      message: "Tour Plan deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getTourPlansByMr = async (req, res) => {
  try {
    const data =
      await service.getTourPlansByMrService(
        req.params.mrId
      );

    res.json({
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

const getTourPlansByDate = async (
  req,
  res
) => {
  try {
    const data =
      await service.getTourPlansByDateService(
        req.params.date
      );

    res.json({
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

const approveTourPlan = async (req, res) => {
  try {
    const data =
      await service.approveTourPlanService(
        req.params.id
      );

    res.json({
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

const completeTourPlan = async (
  req,
  res
) => {
  try {
    const data =
      await service.completeTourPlanService(
        req.params.id
      );

    res.json({
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

const getTodaySchedule = async (
  req,
  res
) => {

  try {

    const data =
      await service.getTodayScheduleService(
        req.params.mrId
      );

    if (!data) {

      return res.status(404).json({
        success: false,
        message: "No Tour Plan Found"
      });

    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

module.exports = {
  createTourPlan,
  getAllTourPlans,
  getTourPlanById,
  updateTourPlan,
  deleteTourPlan,
  getTourPlansByMr,
  getTourPlansByDate,
  approveTourPlan,
  completeTourPlan,
  getTodaySchedule,
};