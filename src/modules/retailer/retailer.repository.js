const prisma = require("../../config/db");

const createRetailerRepo = async (data) => {
  return prisma.retailer.create({
    data,
  });
};

const getRetailersRepo = async () => {
  return prisma.retailer.findMany({
    include: {
      stockist: true,
    },
  });
};

const getRetailerByIdRepo = async (id) => {
  return prisma.retailer.findUnique({
    where: { id },

    include: {
      stockist: true,
    },
  });
};

const updateRetailerRepo = async (
  id,
  data
) => {
  return prisma.retailer.update({
    where: { id },
    data,
  });
};

const deleteRetailerRepo = async (
  id
) => {
  return prisma.retailer.delete({
    where: { id },
  });
};

const getRetailersByStockistRepo =
  async (stockistId) => {
    return prisma.retailer.findMany({
      where: {
        stockistId,
      },

      include: {
        stockist: true,
      },
    });
  };

module.exports = {
  createRetailerRepo,
  getRetailersRepo,
  getRetailerByIdRepo,
  updateRetailerRepo,
  deleteRetailerRepo,
  getRetailersByStockistRepo,
};