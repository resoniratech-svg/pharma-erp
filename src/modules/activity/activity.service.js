const repo = require("./activity.repository");

module.exports = {
  createActivityService: repo.createActivityRepo,

  getAllActivitiesService: repo.getAllActivitiesRepo,

  getActivityByIdService: repo.getActivityByIdRepo,

  updateActivityService: repo.updateActivityRepo,

  deleteActivityService: repo.deleteActivityRepo,

  getActivitiesByMrService: repo.getActivitiesByMrRepo,

  getActivitiesByDateService: repo.getActivitiesByDateRepo,

  completeActivityService: repo.completeActivityRepo,

  cancelActivityService: repo.cancelActivityRepo,
};