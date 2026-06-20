const repository = require("./stockMovement.repository");
const inventoryRepository = require("../inventory/inventory.repository");

const createStockMovementService = async (data) => {
  const {
    inventoryId,
    movementType,
    quantity,
  } = data;

  // Get inventory
  const inventory =
    await inventoryRepository.getInventoryById(
      inventoryId
    );

  if (!inventory) {
    throw new Error(
      "Inventory not found"
    );
  }

  let updatedQuantity =
    inventory.quantity;

  // Stock IN
  if (movementType === "IN") {
    updatedQuantity =
      inventory.quantity + quantity;
  }

  // Stock OUT
  else if (
    movementType === "OUT"
  ) {
    if (
      inventory.quantity <
      quantity
    ) {
      throw new Error(
        "Insufficient stock"
      );
    }

    updatedQuantity =
      inventory.quantity - quantity;
  }

  else {
    throw new Error(
      "Invalid movement type"
    );
  }

  // Update inventory quantity
  await inventoryRepository.updateInventory(
    inventoryId,
    {
      quantity:
        updatedQuantity,
    }
  );

  // Create movement record
  return repository.createStockMovementRepo(
    data
  );
};

const getStockMovementsService =
  () => {
    return repository.getStockMovementsRepo();
  };

const getStockMovementByIdService =
  (id) => {
    return repository.getStockMovementByIdRepo(
      id
    );
  };

module.exports = {
  createStockMovementService,
  getStockMovementsService,
  getStockMovementByIdService,
};