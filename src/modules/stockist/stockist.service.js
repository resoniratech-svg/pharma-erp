const repository = require(
  "./stockist.repository"
);

const createStockistService =
  async (data) => {
    return repository
      .createStockistRepo(data);
  };

const getAllStockistsService =
  async () => {
    return repository
      .getAllStockistsRepo();
  };

const getStockistByIdService =
  async (id) => {
    return repository
      .getStockistByIdRepo(id);
  };

const updateStockistService =
  async (
    id,
    data
  ) => {
    return repository
      .updateStockistRepo(
        id,
        data
      );
  };

const deleteStockistService =
  async (id) => {
    return repository
      .deleteStockistRepo(id);
  };

module.exports = {
  createStockistService,
  getAllStockistsService,
  getStockistByIdService,
  updateStockistService,
  deleteStockistService,
};