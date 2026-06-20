const prisma = require("../../config/db");

const createTransferRepo = (data) => {
  return prisma.warehouseTransfer.create({
    data,
  });
};

const getTransfersRepo = () => {
  return prisma.warehouseTransfer.findMany({
    include: {
      batch: true,
    },
  });
};

const getTransferByIdRepo = (id) => {
  return prisma.warehouseTransfer.findUnique({
    where: { id },
    include: {
      batch: true,
    },
  });
};

module.exports = {
  createTransferRepo,
  getTransfersRepo,
  getTransferByIdRepo,
};