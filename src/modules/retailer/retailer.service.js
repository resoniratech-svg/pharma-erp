const repository =
  require("./retailer.repository");

const createRetailerService =
  async (data) => {
    return repository
      .createRetailerRepo(data);
  };

const getRetailersService =
  async () => {
    return repository
      .getRetailersRepo();
  };

const getRetailerByIdService =
  async (id) => {
    return repository
      .getRetailerByIdRepo(id);
  };

const updateRetailerService =
  async (id, data) => {
    return repository
      .updateRetailerRepo(
        id,
        data
      );
  };

const deleteRetailerService =
  async (id) => {
    return repository
      .deleteRetailerRepo(id);
  };

const getRetailersByStockistService =
  async (stockistId) => {
    return repository
      .getRetailersByStockistRepo(
        stockistId
      );
  };

module.exports = {
  createRetailerService,
  getRetailersService,
  getRetailerByIdService,
  updateRetailerService,
  deleteRetailerService,
  getRetailersByStockistService,
};