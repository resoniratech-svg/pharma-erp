const repository = require("./lowStockAlert.repository");

const getLowStockProductsService = async () => {
  return repository.getLowStockProductsRepo();
};

module.exports = {
  getLowStockProductsService,
};