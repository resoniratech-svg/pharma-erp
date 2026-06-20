const repository = require("./retailerOrderItem.repository");

const createRetailerOrderItemService = async (
  data
) => {
  return repository.createRetailerOrderItemRepo(
    data
  );
};

const getRetailerOrderItemsService =
  async () => {
    return repository.getRetailerOrderItemsRepo();
  };

const getRetailerOrderItemByIdService =
  async (id) => {
    return repository.getRetailerOrderItemByIdRepo(
      id
    );
  };

const updateRetailerOrderItemService =
  async (id, data) => {
    return repository.updateRetailerOrderItemRepo(
      id,
      data
    );
  };

const deleteRetailerOrderItemService =
  async (id) => {
    return repository.deleteRetailerOrderItemRepo(
      id
    );
  };

module.exports = {
  createRetailerOrderItemService,
  getRetailerOrderItemsService,
  getRetailerOrderItemByIdService,
  updateRetailerOrderItemService,
  deleteRetailerOrderItemService,
};