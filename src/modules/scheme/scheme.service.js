const repository = require("./scheme.repository");

const createScheme = async (data) => {
  return await repository.createScheme(data);
};

const getSchemes = async () => {
  return await repository.getSchemes();
};

const getSchemeById = async (id) => {
  const item = await repository.getSchemeById(id);
  if (!item) throw new Error("Scheme not found");
  return item;
};

const updateScheme = async (id, data) => {
  const item = await repository.getSchemeById(id);
  if (!item) throw new Error("Scheme not found");
  return await repository.updateScheme(id, data);
};

const deleteScheme = async (id) => {
  const item = await repository.getSchemeById(id);
  if (!item) throw new Error("Scheme not found");
  return await repository.deleteScheme(id);
};

module.exports = {
  createScheme,
  getSchemes,
  getSchemeById,
  updateScheme,
  deleteScheme,
};