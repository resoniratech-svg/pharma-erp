const repository = require("./expiryMonitoring.repository");

const getExpiringBatchesService = async () => {
  return repository.getExpiringBatchesRepo();
};

module.exports = {
  getExpiringBatchesService,
};