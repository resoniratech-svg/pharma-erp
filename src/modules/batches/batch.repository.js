const prisma = require("../../config/db");

const createBatchRepo = async (
  data
) => {
  const existingBatch = await prisma.batch.findFirst({
    where: { batchNumber: data.batchNumber },
  });

  if (existingBatch) {
    // Merge quantities and update product association if it changed
    return prisma.batch.update({
      where: { id: existingBatch.id },
      data: {
        productId: data.productId,
        quantity: existingBatch.quantity + (data.quantity || 0),
        manufacturingDate: data.manufacturingDate || existingBatch.manufacturingDate,
        expiryDate: data.expiryDate || existingBatch.expiryDate,
      },
    });
  }

  return prisma.batch.create({
    data,
  });
};

const getBatchesRepo = async () => {
  return prisma.batch.findMany({
    include: {
      product: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });
};

const getBatchById = async (
  id
) => {
  return prisma.batch.findUnique({
    where: { id },
    include: {
      product: true,
    },
  });
};

const updateBatch = async (
  id,
  data
) => {
  return prisma.batch.update({
    where: { id },
    data,
  });
};

const deleteBatch = async (id) => {
  // 1. Check if the batch is referenced in WarehouseTransfer or Dispatch
  const linkedTransfers = await prisma.warehouseTransferItem.findFirst({
    where: { batchId: id }
  });
  if (linkedTransfers) {
    throw new Error("Cannot delete batch because it is referenced in warehouse transfers. Please mark it as Inactive instead.");
  }

  const linkedDispatches = await prisma.dispatch.findFirst({
    where: { batchId: id }
  });
  if (linkedDispatches) {
    throw new Error("Cannot delete batch because it is referenced in dispatches. Please mark it as Inactive instead.");
  }

  // 2. Fetch all inventory records for this batch
  const inventories = await prisma.inventory.findMany({
    where: { batchId: id }
  });

  const inventoryIds = inventories.map(inv => inv.id);

  // 3. Delete all StockMovements for these inventories
  if (inventoryIds.length > 0) {
    await prisma.stockMovement.deleteMany({
      where: {
        inventoryId: { in: inventoryIds }
      }
    });

    // 4. Delete the inventories themselves
    await prisma.inventory.deleteMany({
      where: {
        id: { in: inventoryIds }
      }
    });
  }

  // 5. Delete the Batch
  return prisma.batch.delete({
    where: { id },
  });
};

module.exports = {
  createBatchRepo,
  getBatchesRepo,
  getBatchById,
  updateBatch,
  deleteBatch,
};