const repo = require("./followUp.repository");
const notificationService = require("../notification/notification.service");

const createFollowUpService = async (data) => {
  const result = await repo.createFollowUpRepo(data);
  if (data.mrId) {
    try {
      await notificationService.createNotificationService({
        mrId: data.mrId,
        title: 'Follow-Up Created',
        message: `A follow-up was scheduled with priority: ${data.priority}`,
        type: 'follow-up',
        isRead: false
      });
    } catch (e) {
      console.log('Error creating notification', e);
    }
  }
  return result;
};

module.exports = {
  createFollowUpService,

  getAllFollowUpsService: repo.getAllFollowUpsRepo,

  getFollowUpByIdService: repo.getFollowUpByIdRepo,

  updateFollowUpService: repo.updateFollowUpRepo,

  deleteFollowUpService: repo.deleteFollowUpRepo,

  getFollowUpsByMrService: repo.getFollowUpsByMrRepo,

  getFollowUpsByDateService: repo.getFollowUpsByDateRepo,

  completeFollowUpService: repo.completeFollowUpRepo,

  cancelFollowUpService: repo.cancelFollowUpRepo,

  rescheduleFollowUpService: repo.rescheduleFollowUpRepo,
};