const service = require("./meeting.service");

const createMeeting = async (req, res) => {
  try {
    const data =
      await service.createMeetingService(
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

const getAllMeetings = async (req, res) => {
  const data =
    await service.getAllMeetingsService();

  res.json({
    success: true,
    data,
  });
};

const getMeetingById = async (req, res) => {
  const data =
    await service.getMeetingByIdService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const updateMeeting = async (req, res) => {
  const data =
    await service.updateMeetingService(
      req.params.id,
      req.body
    );

  res.json({
    success: true,
    data,
  });
};

const deleteMeeting = async (req, res) => {
  await service.deleteMeetingService(
    req.params.id
  );

  res.json({
    success: true,
    message:
      "Meeting deleted successfully",
  });
};

const getMeetingsByMr = async (
  req,
  res
) => {
  const data =
    await service.getMeetingsByMrService(
      req.params.mrId
    );

  res.json({
    success: true,
    data,
  });
};

const getMeetingsByDate = async (
  req,
  res
) => {
  const data =
    await service.getMeetingsByDateService(
      req.params.date
    );

  res.json({
    success: true,
    data,
  });
};

const completeMeeting = async (
  req,
  res
) => {
  const data =
    await service.completeMeetingService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const cancelMeeting = async (
  req,
  res
) => {
  const data =
    await service.cancelMeetingService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

module.exports = {
  createMeeting,
  getAllMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  getMeetingsByMr,
  getMeetingsByDate,
  completeMeeting,
  cancelMeeting,
};