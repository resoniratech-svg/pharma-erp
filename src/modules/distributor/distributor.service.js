const repository = require("./distributor.repository");

const getDistributorsService = async () => {
  return repository.getDistributorsRepo();
};

module.exports = {
  getDistributorsService,
};
