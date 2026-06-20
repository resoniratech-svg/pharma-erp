const prisma = require("../../config/db");
const repository = require("./warehouseTransfer.repository");

const createTransferService = async (data) => {

  const {
    batchId,
    fromWarehouseId,
    toWarehouseId,
    quantity,
  } = data;

  // Source Inventory
  const sourceInventory =
    await prisma.inventory.findFirst({
      where: {
        batchId,
        warehouseId: fromWarehouseId,
      },
    });

  if (!sourceInventory) {
    throw new Error(
      "Source inventory not found"
    );
  }

  if (
    sourceInventory.quantity <
    quantity
  ) {
    throw new Error(
      "Insufficient stock"
    );
  }

  // Reduce source stock
  await prisma.inventory.update({
    where: {
      id: sourceInventory.id,
    },
    data: {
      quantity:
        sourceInventory.quantity -
        quantity,
    },
  });

  // Destination inventory
  const destinationInventory =
    await prisma.inventory.findFirst({
      where: {
        batchId,
        warehouseId: toWarehouseId,
      },
    });

  if (destinationInventory) {

    await prisma.inventory.update({
      where: {
        id: destinationInventory.id,
      },
      data: {
        quantity:
          destinationInventory.quantity +
          quantity,
      },
    });

  } else {

    await prisma.inventory.create({
      data: {
        batchId,
        warehouseId:
          toWarehouseId,
        quantity,
      },
    });

  }

  return repository.createTransferRepo(
    data
  );
};

const getTransfersService = () => {
  return repository.getTransfersRepo();
};

const getTransferByIdService = (
  id
) => {
  return repository.getTransferByIdRepo(
    id
  );
};

module.exports = {
  createTransferService,
  getTransfersService,
  getTransferByIdService,
};