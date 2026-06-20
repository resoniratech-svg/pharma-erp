const service = require("./notification.service");

const createNotification = async (
  req,
  res
) => {
  try {
    const data =
      await service.createNotificationService(
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

const getAllNotifications = async (
  req,
  res
) => {
  const data =
    await service.getAllNotificationsService();

  res.json({
    success: true,
    data,
  });
};

const getNotificationById = async (
  req,
  res
) => {
  const data =
    await service.getNotificationByIdService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const getNotificationsByMr = async (
  req,
  res
) => {
  const data =
    await service.getNotificationsByMrService(
      req.params.mrId
    );

  res.json({
    success: true,
    data,
  });
};

const markAsRead = async (
  req,
  res
) => {
  const data =
    await service.markAsReadService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const deleteNotification = async (
  req,
  res
) => {
  await service.deleteNotificationService(
    req.params.id
  );

  res.json({
    success: true,
    message:
      "Notification deleted successfully",
  });
};

module.exports = {
  createNotification,
  getAllNotifications,
  getNotificationById,
  getNotificationsByMr,
  markAsRead,
  deleteNotification,
};