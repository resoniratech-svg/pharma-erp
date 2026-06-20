const repo = require("./meeting.repository");

module.exports = {
  createMeetingService: repo.createMeetingRepo,

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