const prisma = require("../../config/db");
const service = require("./meeting.service");

const createMeeting = async (req, res) => {
  try {
    let mrId = Number(req.body.mrId);
    if (req.user && req.user.id) {
      const mr = await prisma.mR.findUnique({
        where: { userId: req.user.id },
      });
      if (mr) {
        mrId = mr.id;
      } else if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN' || req.user.role === 'AREA_SALES_MANAGER' || req.user.role === 'REGIONAL_SALES_MANAGER' || req.user.role === 'NATIONAL_SALES_MANAGER') {
        const firstMR = await prisma.mR.findFirst();
        if (firstMR) {
          mrId = firstMR.id;
        }
      }
    }

    const data = await service.createMeetingService({
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
  let mrId = Number(req.params.mrId);
  if (req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN' || req.user.role === 'AREA_SALES_MANAGER' || req.user.role === 'REGIONAL_SALES_MANAGER' || req.user.role === 'NATIONAL_SALES_MANAGER')) {
    if (mrId === 0 || mrId === 1) {
      const firstMR = await prisma.mR.findFirst();
      if (firstMR) mrId = firstMR.id;
    }
  }

  const data =
    await service.getMeetingsByMrService(
      mrId
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