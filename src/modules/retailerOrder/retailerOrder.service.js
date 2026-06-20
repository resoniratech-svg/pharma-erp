const repository =
require("./retailerOrder.repository");

const createRetailerOrderService =
async (data) => {
  return repository
    .createRetailerOrderRepo(data);
};

const getRetailerOrdersService =
async () => {
  return repository
    .getRetailerOrdersRepo();
};

const getRetailerOrderByIdService =
async (id) => {
  return repository
    .getRetailerOrderByIdRepo(id);
};

const updateRetailerOrderService =
async (id, data) => {
  return repository
    .updateRetailerOrderRepo(
      id,
      data
    );
};

const deleteRetailerOrderService =
async (id) => {
  return repository
    .deleteRetailerOrderRepo(id);
};

module.exports = {
  createRetailerOrderService,
  getRetailerOrdersService,
  getRetailerOrderByIdService,
  updateRetailerOrderService,
  deleteRetailerOrderService,
};