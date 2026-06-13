const prisma = require("../../config/db");

const createCategory = async (data) => {
  return await prisma.productCategory.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
};

const getAllCategories = async () => {
  return await prisma.productCategory.findMany({
    orderBy: {
      id: "asc",
    },
  });
};

const getCategoryById = async (id) => {
  return await prisma.productCategory.findUnique({
    where: {
      id,
    },
  });
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
};