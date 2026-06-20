const repository = require("./tourPlan.repository");

const createTourPlanService = async (data) => {
  return repository.createTourPlanRepo(data);
};

const getAllTourPlansService = async () => {
  return repository.getAllTourPlansRepo();
};

const getTourPlanByIdService = async (id) => {
  return repository.getTourPlanByIdRepo(id);
};

const updateTourPlanService = async (
  id,
  data
) => {
  return repository.updateTourPlanRepo(
    id,
    data
  );
};

const deleteTourPlanService = async (
  id
) => {
  return repository.deleteTourPlanRepo(
    id
  );
};

const getTourPlansByMrService = async (
  mrId
) => {
  return repository.getTourPlansByMrRepo(
    mrId
  );
};

const getTourPlansByDateService = async (
  date
) => {
  return repository.getTourPlansByDateRepo(
    date
  );
};

const approveTourPlanService = async (
  id
) => {
  return repository.approveTourPlanRepo(
    id
  );
};

const completeTourPlanService = async (
  id
) => {
  return repository.completeTourPlanRepo(
    id
  );
};

module.exports = {
  createTourPlanService,
  getAllTourPlansService,
  getTourPlanByIdService,
  updateTourPlanService,
  deleteTourPlanService,
  getTourPlansByMrService,
  getTourPlansByDateService,
  approveTourPlanService,
  completeTourPlanService,
};