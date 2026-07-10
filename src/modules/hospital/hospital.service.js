const repository = require("./hospital.repository");

const getHospitalsService = async () => {
  return repository.getHospitalsRepo();
};

module.exports = {
  getHospitalsService,
};
