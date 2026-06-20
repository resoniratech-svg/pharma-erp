const prisma = require("../../config/db");

const createInventoryRepo = async (
  data
) => {
  return prisma.inventory.create({
    data,
  });
};

const getInventoriesRepo = async () => {
  return prisma.inventory.findMany({
    include: {
      batch: true,
    },
  });
};

const getInventoryById = async (
  id
) => {
  return prisma.inventory.findUnique({
    where: { id },
    include: {
      batch: true,
    },
  });
};

const updateInventory = async (
  id,
  data
) => {
  return prisma.inventory.update({
    where: { id },
    data,
  });
};

const deleteInventory = async (
  id
) => {
  return prisma.inventory.delete({
    where: { id },
  });
};

const getInventoryByCompanyRepo = async (companyId) => {
  return prisma.inventory.findMany({
    where: {
      batch: {
        product: {
          companyId: companyId,
        },
      },
    },
    include: {
      batch: {
        include: {
          product: true,
        },
      },
      warehouse: true,
    },
  });
};

module.exports = {
  createInventoryRepo,
  getInventoriesRepo,
  getInventoryById,
  updateInventory,
  deleteInventory,
  getInventoryByCompanyRepo,
};