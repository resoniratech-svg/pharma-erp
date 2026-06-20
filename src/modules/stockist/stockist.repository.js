const prisma = require("../../config/db");

const createStockistRepo = async (data) => {
  return prisma.stockist.create({
    data,
  });
};

const getAllStockistsRepo = async () => {
  return prisma.stockist.findMany();
};

const getStockistByIdRepo = async (id) => {
  return prisma.stockist.findUnique({
    where: { id },
  });
};

const updateStockistRepo = async (
  id,
  data
) => {
  return prisma.stockist.update({
    where: { id },
    data,
  });
};

const deleteStockistRepo = async (
  id
) => {
  return prisma.stockist.delete({
    where: { id },
  });
};

module.exports = {
  createStockistRepo,
  getAllStockistsRepo,
  getStockistByIdRepo,
  updateStockistRepo,
  deleteStockistRepo,
};