const repo = require("./notification.repository");

module.exports = {
  createNotificationService:
    repo.createNotificationRepo,

  getAllNotificationsService:
    repo.getAllNotificationsRepo,

  getNotificationByIdService:
    repo.getNotificationByIdRepo,

  getNotificationsByMrService:
    repo.getNotificationsByMrRepo,

  markAsReadService:
    repo.markAsReadRepo,

  deleteNotificationService:
    repo.deleteNotificationRepo,
};