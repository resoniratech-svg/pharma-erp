const repository = require(
  "./inventory.repository"
);

const createInventoryService = (
  data
) => {
  return repository.createInventoryRepo(
    data
  );
};

const getInventoriesService = () => {
  return repository.getInventoriesRepo();
};

const getInventoryById = (
  id
) => {
  return repository.getInventoryById(
    id
  );
};

const updateInventory = (
  id,
  data
) => {
  return repository.updateInventory(
    id,
    data
  );
};

const deleteInventory = (
  id
) => {
  return repository.deleteInventory(
    id
  );
};

module.exports = {
  createInventoryService,
  getInventoriesService,
  getInventoryById,
  updateInventory,
  deleteInventory,
};