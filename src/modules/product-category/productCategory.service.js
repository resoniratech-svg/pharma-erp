const repository = require(
  "./productCategory.repository"
);

const createCategory = async (data) => {
  return await repository.createCategory(
    data
  );
};

const getAllCategories = async () => {
  return await repository.getAllCategories();
};

const getCategoryById = async (id) => {
  return await repository.getCategoryById(id);
};

module.exports = {
  createCategory,
  getAllCategories,
   getCategoryById,
};