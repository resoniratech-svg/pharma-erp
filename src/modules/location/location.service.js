const repo = require("./location.repository");

const getLocationsService = async () => {
  return repo.getLocationsRepo();
};

const createLocationService = async (data) => {
  return repo.createLocationRepo(data);
};

module.exports = {
  getLocationsService,
  createLocationService
};
