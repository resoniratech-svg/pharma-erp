const service = require("./activity.service");

const createActivity = async (req, res) => {
  try {
    const data =
      await service.createActivityService(req.body);

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

const getAllActivities = async (req, res) => {
  const data =
    await service.getAllActivitiesService();

  res.json({
    success: true,
    data,
  });
};

const getActivityById = async (req, res) => {
  const data =
    await service.getActivityByIdService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const updateActivity = async (req, res) => {
  const data =
    await service.updateActivityService(
      req.params.id,
      req.body
    );

  res.json({
    success: true,
    data,
  });
};

const deleteActivity = async (req, res) => {
  await service.deleteActivityService(
    req.params.id
  );

  res.json({
    success: true,
    message:
      "Activity deleted successfully",
  });
};

const getActivitiesByMr = async (
  req,
  res
) => {
  const data =
    await service.getActivitiesByMrService(
      req.params.mrId
    );

  res.json({
    success: true,
    data,
  });
};

const getActivitiesByDate = async (
  req,
  res
) => {
  const data =
    await service.getActivitiesByDateService(
      req.params.date
    );

  res.json({
    success: true,
    data,
  });
};

const completeActivity = async (
  req,
  res
) => {
  const data =
    await service.completeActivityService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const cancelActivity = async (
  req,
  res
) => {
  const data =
    await service.cancelActivityService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

module.exports = {
  createActivity,
  getAllActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  getActivitiesByMr,
  getActivitiesByDate,
  completeActivity,
  cancelActivity,
};