const repository = require("./deadStock.repository");

const getDeadStockService = () => {
  return repository.getDeadStockRepo();
};

module.exports = {
  getDeadStockService,
};