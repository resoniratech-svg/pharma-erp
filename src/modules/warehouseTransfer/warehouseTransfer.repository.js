const prisma = require("../../config/db");

const createTransferRepo = (data) => {
  return prisma.warehouseTransfer.create({
    data,
  });
};

const getTransfersRepo = () => {
  return prisma.warehouseTransfer.findMany({
    include: {
      items: {
        include: {
          product: true,
          batch: true,
        },
      },
    },
  });
};

const getTransferByIdRepo = (id) => {
  return prisma.warehouseTransfer.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
          batch: true,
        },
      },
    },
  });
};

const updateTransferStatusRepo = (id, status) => {
  return prisma.warehouseTransfer.update({
    where: { id },
    data: { status },
  });
};

module.exports = {
  createTransferRepo,
  getTransfersRepo,
  getTransferByIdRepo,
  updateTransferStatusRepo,
};