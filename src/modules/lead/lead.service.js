const repo = require("./lead.repository");

module.exports = {
  createLeadService: repo.createLeadRepo,
  getAllLeadsService: repo.getAllLeadsRepo,
  getLeadByIdService: repo.getLeadByIdRepo,
  updateLeadService: repo.updateLeadRepo,
  deleteLeadService: repo.deleteLeadRepo,
  getLeadsByMrService: repo.getLeadsByMrRepo,
  assignLeadService: repo.assignLeadRepo,
  convertLeadService: repo.convertLeadRepo,
};