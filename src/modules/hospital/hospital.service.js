const repository = require("./hospital.repository");

const getHospitalsService = async () => {
  return repository.getHospitalsRepo();
};

const createHospitalService = async (data) => {
  return repository.createHospitalRepo(data);
};

module.exports = {
  getHospitalsService,
  createHospitalService,
};
