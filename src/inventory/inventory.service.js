const repository = require("./inventory.repository");

const createInventoryService = async (data) => {
  return repository.createInventoryRepo(data);
};

const getInventoriesService = async () => {
  return repository.getInventoriesRepo();
};

const getInventoryByIdService = async (id) => {
  return repository.getInventoryById(id);
};

const updateInventoryService = async (
  id,
  data
) => {
  return repository.updateInventory(
    id,
    data
  );
};

const deleteInventoryService = async (
  id
) => {
  return repository.deleteInventory(id);
};

const getInventoryByCompanyService =
  async (companyId) => {
    return repository
      .getInventoryByCompanyRepo(
        companyId
      );
  };

module.exports = {
  createInventoryService,
  getInventoriesService,
  getInventoryByIdService,
  updateInventoryService,
  deleteInventoryService,
  getInventoryByCompanyService,
};