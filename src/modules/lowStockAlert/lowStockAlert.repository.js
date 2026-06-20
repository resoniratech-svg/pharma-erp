const prisma = require("../../config/db");

const getLowStockProductsRepo = async () => {
  const inventories = await prisma.inventory.findMany({
    include: {
      batch: {
        include: {
          product: true,
        },
      },
    },
  });

return inventories
  .filter(
    (inventory) =>
      inventory.quantity <=
      inventory.batch.product.minStock
  )
  .map((inventory) => ({
    inventoryId: inventory.id,
    productName:
      inventory.batch.product.name,
    currentStock: inventory.quantity,
    minStock:
      inventory.batch.product.minStock,
    warehouseId: inventory.warehouseId,
  }));
};

module.exports = {
  getLowStockProductsRepo,
};