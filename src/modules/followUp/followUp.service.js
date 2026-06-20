const repo = require("./followUp.repository");

module.exports = {
  createFollowUpService: repo.createFollowUpRepo,

  getAllFollowUpsService: repo.getAllFollowUpsRepo,

  getFollowUpByIdService: repo.getFollowUpByIdRepo,

  updateFollowUpService: repo.updateFollowUpRepo,

  deleteFollowUpService: repo.deleteFollowUpRepo,

  getFollowUpsByMrService: repo.getFollowUpsByMrRepo,

  getFollowUpsByDateService: repo.getFollowUpsByDateRepo,

  completeFollowUpService: repo.completeFollowUpRepo,

  cancelFollowUpService: repo.cancelFollowUpRepo,
};