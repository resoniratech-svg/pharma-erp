const repository = require(
  "./product.repository"
);

const createProductService = (
  data
) => {
  return repository.createProductRepo(
    data
  );
};

const getProductsService = () => {
  return repository.getProductsRepo();
};

const getProductById = (
  id
) => {
  return repository.getProductById(
    id
  );
};

const updateProduct = (
  id,
  data
) => {
  return repository.updateProduct(
    id,
    data
  );
};

const deleteProduct = (
  id
) => {
  return repository.deleteProduct(
    id
  );
};

module.exports = {
  createProductService,
  getProductsService,
  getProductById,
  updateProduct,
  deleteProduct,
};