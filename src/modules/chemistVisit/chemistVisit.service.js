const {
  createChemistVisitRepo,
  getAllChemistVisitsRepo,
  getChemistVisitByIdRepo,
  updateChemistVisitRepo,
  deleteChemistVisitRepo,
  getChemistVisitsByMrRepo,
  getChemistVisitsByChemistRepo,
} = require("./chemistVisit.repository");

const createChemistVisit = async (data) => {
  return createChemistVisitRepo(data);
};

const getAllChemistVisits = async () => {
  return getAllChemistVisitsRepo();
};

const getChemistVisitById = async (id) => {
  return getChemistVisitByIdRepo(id);
};

const updateChemistVisit = async (id, data) => {
  return updateChemistVisitRepo(id, data);
};

const deleteChemistVisit = async (id) => {
  return deleteChemistVisitRepo(id);
};

const getChemistVisitsByMr = async (mrId) => {
  return getChemistVisitsByMrRepo(mrId);
};

const getChemistVisitsByChemist = async (chemistId) => {
  return getChemistVisitsByChemistRepo(chemistId);
};

module.exports = {
  createChemistVisit,
  getAllChemistVisits,
  getChemistVisitById,
  updateChemistVisit,
  deleteChemistVisit,
  getChemistVisitsByMr,
  getChemistVisitsByChemist,
};