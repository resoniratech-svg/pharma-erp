const prisma = require("../../config/db");

const createProductRepo = async (data) => {
  return prisma.product.create({
    data,
  });
};

const getProductsRepo = async () => {
  return prisma.product.findMany({
    include: {
      category: true,
      company: true,
    },
  });
};

const getProductById = async (id) => {
  return prisma.product.findUnique({
    where: {
      id,
    },
    include: {
      category: true,
      company: true,
    },
  });
};

const updateProduct = async (
  id,
  data
) => {
  return prisma.product.update({
    where: {
      id,
    },
    data,
  });
};

const deleteProduct = async (
  id
) => {
  return prisma.product.delete({
    where: {
      id,
    },
  });
};

module.exports = {
  createProductRepo,
  getProductsRepo,
  getProductById,
  updateProduct,
  deleteProduct,
};