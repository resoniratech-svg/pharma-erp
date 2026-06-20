const prisma = require("../../config/db");

const getDeadStockRepo = async () => {
  const inventories = await prisma.inventory.findMany({
    include: {
      batch: {
        include: {
          product: true,
        },
      },
      stockMovements: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  return inventories.filter((inventory) => {

    if (inventory.stockMovements.length === 0) { 
      return true;
    }

   const lastMovement =
  inventory.stockMovements[0];

    const daysDifference =
      Math.floor(
        (new Date() -
          new Date(lastMovement.createdAt))
        / (1000 * 60 * 60 * 24)
      );

    return daysDifference > 90;
  });
};

module.exports = {
  getDeadStockRepo,
};