const repo = require("./target.repository");

const createTargetService = async (data) => {
  return repo.createTargetRepo(data);
};

const getAllTargetsService = async () => {
  return repo.getAllTargetsRepo();
};

const getTargetByIdService = async (id) => {
  return repo.getTargetByIdRepo(id);
};

const updateTargetService = async (
  id,
  data
) => {
  return repo.updateTargetRepo(id, data);
};

const deleteTargetService = async (id) => {
  return repo.deleteTargetRepo(id);
};

const getTargetsByMrService = async (
  mrId
) => {
  return repo.getTargetsByMrRepo(mrId);
};

const getTargetsByMonthService = async (
  month,
  year
) => {
  return repo.getTargetsByMonthRepo(
    month,
    year
  );
};

module.exports = {
  createTargetService,
  getAllTargetsService,
  getTargetByIdService,
  updateTargetService,
  deleteTargetService,
  getTargetsByMrService,
  getTargetsByMonthService,
};