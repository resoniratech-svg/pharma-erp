const repository =
  require("./doctorVisit.repository");

const createDoctorVisitService =
  async (data) => {
    return repository.createDoctorVisitRepo(
      data
    );
  };

const getDoctorVisitsService =
  async () => {
    return repository.getDoctorVisitsRepo();
  };

const getDoctorVisitByIdService =
  async (id) => {
    return repository.getDoctorVisitByIdRepo(
      id
    );
  };

const updateDoctorVisitService =
  async (id, data) => {
    return repository.updateDoctorVisitRepo(
      id,
      data
    );
  };

const deleteDoctorVisitService =
  async (id) => {
    return repository.deleteDoctorVisitRepo(
      id
    );
  };

const getDoctorVisitsByMRService =
  async (mrId) => {
    return repository.getDoctorVisitsByMRRepo(
      mrId
    );
  };

const getDoctorVisitsByDoctorService =
  async (doctorId) => {
    return repository.getDoctorVisitsByDoctorRepo(
      doctorId
    );
  };

module.exports = {
  createDoctorVisitService,
  getDoctorVisitsService,
  getDoctorVisitByIdService,
  updateDoctorVisitService,
  deleteDoctorVisitService,
  getDoctorVisitsByMRService,
  getDoctorVisitsByDoctorService,
};