const repository = require("./dispatch.repository");
const prisma = require("../../config/db");

const createDispatchService = async (data) => {
  return repository.createDispatchRepo(data);
};

const getDispatchesService = async () => {
  return repository.getDispatchesRepo();
};

const getDispatchByIdService = async (id) => {
  return repository.getDispatchByIdRepo(id);
};

const updateDispatchService = async (id, data) => {
  const currentDispatch = await repository.getDispatchByIdRepo(id);
  if (!currentDispatch) {
    throw new Error("Dispatch not found");
  }

  const oldStatus = currentDispatch.status;
  const newStatus = data.status;

  const updatedDispatch = await repository.updateDispatchRepo(id, data);

  if (oldStatus !== newStatus) {
    const isTransit = newStatus === "IN_TRANSIT" || newStatus === "In Transit" || newStatus === "Dispatched";
    const isDelivered = newStatus === "DELIVERED" || newStatus === "Delivered";

    if (isTransit) {
      const sourceWarehouseId = currentDispatch.warehouseId;
      const products = currentDispatch.products;

      if (sourceWarehouseId && Array.isArray(products)) {
        await prisma.$transaction(async (tx) => {
          for (const item of products) {
            const batchId = Number(item.batchId);
            if (!batchId) continue;

            const existingInv = await tx.inventory.findFirst({
              where: { batchId, warehouseId: sourceWarehouseId }
            });

            if (existingInv) {
              const newQty = Math.max(0, existingInv.quantity - Number(item.quantity));
              await tx.inventory.update({
                where: { id: existingInv.id },
                data: { quantity: newQty }
              });

              await tx.stockMovement.create({
                data: {
                  inventoryId: existingInv.id,
                  quantity: Number(item.quantity),
                  movementType: "OUTWARD",
                  remarks: `Dispatched outward under Dispatch No ${currentDispatch.dispatchNo}`
                }
              });
            }
          }
        });
      }
    }

    if (isDelivered) {
      let targetWarehouseCode = "DIST-001";
      if (currentDispatch.customerName) {
        const match = currentDispatch.customerName.match(/DIST-\d+/i);
        if (match) {
          targetWarehouseCode = match[0].toUpperCase();
        } else if (currentDispatch.customerName.includes("DIST-")) {
          targetWarehouseCode = currentDispatch.customerName;
        }
      }

      let targetWarehouse = await prisma.warehouse.findFirst({
        where: { code: targetWarehouseCode }
      });

      if (!targetWarehouse) {
        targetWarehouse = await prisma.warehouse.findFirst({
          where: { code: "DIST-001" }
        });
      }

      const products = currentDispatch.products;

      if (targetWarehouse && Array.isArray(products)) {
        await prisma.$transaction(async (tx) => {
          for (const item of products) {
            const batchId = Number(item.batchId);
            if (!batchId) continue;

            let existingInv = await tx.inventory.findFirst({
              where: { batchId, warehouseId: targetWarehouse.id }
            });

            if (!existingInv) {
              existingInv = await tx.inventory.create({
                data: {
                  batchId,
                  warehouseId: targetWarehouse.id,
                  quantity: 0
                }
              });
            }

            const updatedInv = await tx.inventory.update({
              where: { id: existingInv.id },
              data: { quantity: existingInv.quantity + Number(item.quantity) }
            });

            await tx.stockMovement.create({
              data: {
                inventoryId: existingInv.id,
                quantity: Number(item.quantity),
                movementType: "INWARD",
                remarks: `Received inward under Dispatch No ${currentDispatch.dispatchNo}`
              }
            });
          }

          if (currentDispatch.dispatchNo) {
            const outward = await tx.outwardStock.findUnique({
              where: { dispatchNo: currentDispatch.dispatchNo }
            });
            if (outward) {
              await tx.outwardStock.update({
                where: { id: outward.id },
                data: { status: "Delivered" }
              });
            }
          }
        });
      }
    }
  }

  return updatedDispatch;
};

module.exports = {
  createDispatchService,
  getDispatchesService,
  getDispatchByIdService,
  updateDispatchService,
};