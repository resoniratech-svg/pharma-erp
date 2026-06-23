const service = require("./followUp.service");

const createFollowUp = async (req, res) => {
  try {

    console.log("FOLLOWUP REQUEST:", req.body);

    const data =
      await service.createFollowUpService(req.body);

    res.status(201).json({
      success: true,
      data,
    });

  } catch (error) {

    console.log("FOLLOWUP ERROR:");
    console.log(error);

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }
};

const getAllFollowUps = async (req, res) => {
  const data =
    await service.getAllFollowUpsService();

  res.json({
    success: true,
    data,
  });
};

const getFollowUpById = async (req, res) => {
  const data =
    await service.getFollowUpByIdService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const updateFollowUp = async (req, res) => {
  const data =
    await service.updateFollowUpService(
      req.params.id,
      req.body
    );

  res.json({
    success: true,
    data,
  });
};

const deleteFollowUp = async (req, res) => {
  await service.deleteFollowUpService(
    req.params.id
  );

  res.json({
    success: true,
    message:
      "Follow Up deleted successfully",
  });
};

const getFollowUpsByMr = async (req, res) => {
  const data =
    await service.getFollowUpsByMrService(
      req.params.mrId
    );

  res.json({
    success: true,
    data,
  });
};

const getFollowUpsByDate = async (
  req,
  res
) => {
  const data =
    await service.getFollowUpsByDateService(
      req.params.date
    );

  res.json({
    success: true,
    data,
  });
};

const completeFollowUp = async (
  req,
  res
) => {
  const data =
    await service.completeFollowUpService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const cancelFollowUp = async (
  req,
  res
) => {
  const data =
    await service.cancelFollowUpService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

module.exports = {
  createFollowUp,
  getAllFollowUps,
  getFollowUpById,
  updateFollowUp,
  deleteFollowUp,
  getFollowUpsByMr,
  getFollowUpsByDate,
  completeFollowUp,
  cancelFollowUp,
};