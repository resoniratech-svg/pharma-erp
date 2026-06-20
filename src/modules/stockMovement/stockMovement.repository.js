const prisma = require("../../config/db");

const createStockMovementRepo = (data) => {
  return prisma.stockMovement.create({
    data,
  });
};

const getStockMovementsRepo = () => {
  return prisma.stockMovement.findMany({
    include: {
      inventory: true,
    },
  });
};

const getStockMovementByIdRepo = (id) => {
  return prisma.stockMovement.findUnique({
    where: { id },
    include: {
      inventory: true,
    },
  });
};

module.exports = {
  createStockMovementRepo,
  getStockMovementsRepo,
  getStockMovementByIdRepo,
};