const repository = require("./packing-type.repository");

const createPackingType = async (data) => {
  return await repository.createPackingType(data);
};

const getPackingTypes = async () => {
  return await repository.getPackingTypes();
};

const getPackingTypeById = async (id) => {
  const item = await repository.getPackingTypeById(id);
  if (!item) throw new Error("PackingType not found");
  return item;
};

const updatePackingType = async (id, data) => {
  const item = await repository.getPackingTypeById(id);
  if (!item) throw new Error("PackingType not found");
  return await repository.updatePackingType(id, data);
};

const deletePackingType = async (id) => {
  const item = await repository.getPackingTypeById(id);
  if (!item) throw new Error("PackingType not found");
  return await repository.deletePackingType(id);
};

module.exports = {
  createPackingType,
  getPackingTypes,
  getPackingTypeById,
  updatePackingType,
  deletePackingType,
};