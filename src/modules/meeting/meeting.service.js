const repo = require("./meeting.repository");
const notificationService = require("../notification/notification.service");

const createMeetingService = async (data) => {
  const result = await repo.createMeetingRepo(data);
  if (data.mrId) {
    try {
      await notificationService.createNotificationService({
        mrId: data.mrId,
        title: 'Meeting Scheduled',
        message: `A new meeting has been scheduled for ${data.date}`,
        type: 'meeting',
        isRead: false
      });
    } catch (e) {
      console.log('Error creating notification', e);
    }
  }
  return result;
};

module.exports = {
  createMeetingService,

  getAllMeetingsService: repo.getAllMeetingsRepo,

  getMeetingByIdService: repo.getMeetingByIdRepo,

  updateMeetingService: repo.updateMeetingRepo,

  deleteMeetingService: repo.deleteMeetingRepo,

  getMeetingsByMrService: repo.getMeetingsByMrRepo,

  getMeetingsByDateService:
    repo.getMeetingsByDateRepo,

  completeMeetingService:
    repo.completeMeetingRepo,

  cancelMeetingService:
    repo.cancelMeetingRepo,
};