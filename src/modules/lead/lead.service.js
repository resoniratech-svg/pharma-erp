const repo = require("./lead.repository");

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
  updateLeadService: repo.updateLeadRepo,
  deleteLeadService: repo.deleteLeadRepo,
  getLeadsByMrService: repo.getLeadsByMrRepo,
  assignLeadService: repo.assignLeadRepo,
  convertLeadService: repo.convertLeadRepo,
};