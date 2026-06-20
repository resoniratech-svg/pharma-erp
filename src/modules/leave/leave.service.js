const repo = require("./leave.repository");

module.exports = {
  createLeaveService: repo.createLeaveRepo,

  getAllLeavesService: repo.getAllLeavesRepo,

  getLeaveByIdService: repo.getLeaveByIdRepo,

  updateLeaveService: repo.updateLeaveRepo,

  deleteLeaveService: repo.deleteLeaveRepo,

  getLeavesByMrService: repo.getLeavesByMrRepo,

  approveLeaveService: repo.approveLeaveRepo,

  rejectLeaveService: repo.rejectLeaveRepo,
};