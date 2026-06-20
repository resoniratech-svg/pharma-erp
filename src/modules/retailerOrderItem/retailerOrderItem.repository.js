const prisma = require("../../config/db");

const createRetailerOrderItemRepo = async (data) => {
  return prisma.retailerOrderItem.create({
    data,
  });
};

const getRetailerOrderItemsRepo = async () => {
  return prisma.retailerOrderItem.findMany({
    include: {
      retailerOrder: true,
      product: true,
    },
  });
};

const getRetailerOrderItemByIdRepo = async (id) => {
  return prisma.retailerOrderItem.findUnique({
    where: { id },
    include: {
      retailerOrder: true,
      product: true,
    },
  });
};

const updateRetailerOrderItemRepo = async (
  id,
  data
) => {
  return prisma.retailerOrderItem.update({
    where: { id },
    data,
  });
};

const deleteRetailerOrderItemRepo = async (
  id
) => {
  return prisma.retailerOrderItem.delete({
    where: { id },
  });
};

module.exports = {
  createRetailerOrderItemRepo,
  getRetailerOrderItemsRepo,
  getRetailerOrderItemByIdRepo,
  updateRetailerOrderItemRepo,
  deleteRetailerOrderItemRepo,
};