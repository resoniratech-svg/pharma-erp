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

const notificationService = require("../notification/notification.service");

const approveTourPlanService = async (id) => {
  const plan = await repository.approveTourPlanRepo(id);
  if (plan && plan.mrId) {
    await notificationService.createNotificationService({
      mrId: plan.mrId,
      title: "Tour Plan Approved",
      message: `Your tour plan for ${new Date(plan.tourDate).toLocaleDateString()} has been approved.`,
      type: "ALERT"
    });
  }
  return plan;
};

const rejectTourPlanService = async (id, remarks) => {
  const plan = await repository.rejectTourPlanRepo(id);
  if (plan && plan.mrId) {
    await notificationService.createNotificationService({
      mrId: plan.mrId,
      title: "Tour Plan Rejected",
      message: `Your tour plan for ${new Date(plan.tourDate).toLocaleDateString()} was rejected. Remarks: ${remarks || 'None'}`,
      type: "ALERT"
    });
  }
  return plan;
};

const completeTourPlanService = async (
  id
) => {
  return repository.completeTourPlanRepo(
    id
  );
};

const getTodayScheduleService = async (
  mrId
) => {

  return repository.getTodayScheduleRepo(
    mrId
  );

};

const getASMTourPlansService = async (asmId) => {
  return repository.getASMTourPlansRepo(asmId);
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
  rejectTourPlanService,
  completeTourPlanService,
  getTodayScheduleService,
  getASMTourPlansService,
};