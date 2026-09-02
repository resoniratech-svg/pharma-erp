const repo = require("./lead.repository");
const notificationService = require("../notification/notification.service");

const convertLeadService = async (id, data) => {
  const result = await repo.convertLeadRepo(id, data);
  if (result.mrId) {
    try {
      await notificationService.createNotificationService({
        mrId: result.mrId,
        title: 'Lead Converted! 🎉',
        message: `Congratulations! Lead ${result.id} has been successfully converted.`,
        type: 'lead',
        isRead: false
      });
    } catch (e) {
      console.log('Error creating notification', e);
    }
  }
  return result;
};

const updateLeadService = async (id, data) => {
  const result = await repo.updateLeadRepo(id, data);
  if (data.status === 'CONVERTED' && result.mrId) {
    try {
      await notificationService.createNotificationService({
        mrId: result.mrId,
        title: 'Lead Converted! 🎉',
        message: `Congratulations! Lead ${result.id} has been successfully converted.`,
        type: 'lead',
        isRead: false
      });
    } catch (e) {
      console.log('Error creating notification', e);
    }
  }
  return result;
};

const createLeadService = async (data) => {
  const leadCode = `LD-${Date.now()}`;
  const creatorInfoStr = data.creatorInfo ? JSON.stringify(data.creatorInfo) : null;

  const cleanData = {
    ...data,
    leadCode,
    creatorInfo: creatorInfoStr,
  };

  return repo.createLeadRepo(cleanData);
};

module.exports = {
  createLeadService,
  getAllLeadsService: repo.getAllLeadsRepo,
  getLeadByIdService: repo.getLeadByIdRepo,
  updateLeadService,
  deleteLeadService: repo.deleteLeadRepo,
  getLeadsByMrService: repo.getLeadsByMrRepo,
  assignLeadService: repo.assignLeadRepo,
  convertLeadService,
};