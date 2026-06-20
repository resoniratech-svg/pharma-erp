const repository = require("./warehouse.repository");

const createWarehouseService = (data) =>
  repository.createWarehouseRepo(data);

const getWarehousesService = () =>
  repository.getWarehousesRepo();

const getWarehouseByIdService = (id) =>
  repository.getWarehouseByIdRepo(id);

const updateWarehouseService = (id, data) =>
  repository.updateWarehouseRepo(id, data);

const deleteWarehouseService = (id) =>
  repository.deleteWarehouseRepo(id);

module.exports = {
  createWarehouseService,
  getWarehousesService,
  getWarehouseByIdService,
  updateWarehouseService,
  deleteWarehouseService,
};