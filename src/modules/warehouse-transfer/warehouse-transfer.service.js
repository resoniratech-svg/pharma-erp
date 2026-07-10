const repository = require('./warehouse-transfer.repository');

const createWarehouseTransfer = async (data) => {
  return repository.create(data);
};

const getWarehouseTransfers = async () => {
  return repository.findAll();
};

const getWarehouseTransferById = async (id) => {
  return repository.findById(id);
};

const updateWarehouseTransfer = async (id, data) => {
  return repository.update(id, data);
};

const deleteWarehouseTransfer = async (id) => {
  return repository.remove(id);
};

module.exports = {
  createWarehouseTransfer,
  getWarehouseTransfers,
  getWarehouseTransferById,
  updateWarehouseTransfer,
  deleteWarehouseTransfer
};
