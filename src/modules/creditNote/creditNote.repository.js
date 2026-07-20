const prisma = require("../../config/db");

class CreditNoteRepository {
  async create(data) {
    const { items, ...creditNoteData } = data;
    return prisma.creditNote.create({
      data: {
        ...creditNoteData,
        items: items && items.length > 0 ? {
          create: items
        } : undefined
      },
      include: {
        items: {
          include: {
            product: true,
            batch: true
          }
        },
        retailer: true,
        distributor: true,
        mr: true,
        againstInvoice: true
      }
    });
  }

  async findAll(filters) {
    const where = {};
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.section) {
      const section = filters.section.toLowerCase();
      if (section === 'retailer') {
        where.retailerId = { not: null };
      } else if (section === 'distributor') {
        where.distributorId = { not: null };
      } else if (section === 'mr') {
        where.mrId = { not: null };
      }
    }

    return prisma.creditNote.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
            batch: true
          }
        },
        retailer: true,
        distributor: true,
        mr: true,
        againstInvoice: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findById(id) {
    return prisma.creditNote.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        items: {
          include: {
            product: true,
            batch: true
          }
        },
        retailer: true,
        distributor: true,
        mr: true,
        againstInvoice: true
      }
    });
  }

  async update(id, data) {
    return prisma.creditNote.update({
      where: { id: parseInt(id, 10) },
      data,
      include: {
        items: {
          include: {
            product: true,
            batch: true
          }
        },
        retailer: true,
        distributor: true,
        mr: true,
        againstInvoice: true
      }
    });
  }

  async executeSettlementTx(creditNoteId, settlementAmount, remarks, approvedByUserId) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch current Credit Note state
      const cn = await tx.creditNote.findUnique({
        where: { id: creditNoteId },
        include: { items: true }
      });

      if (!cn) {
        throw new Error("Credit Note not found");
      }

      const newAmountSettled = cn.amountSettled + settlementAmount;
      if (newAmountSettled > cn.totalAmount + 0.01) {
        throw new Error(`Settlement amount exceeds total Credit Note value. Total: ${cn.totalAmount}, Settled: ${cn.amountSettled}, Applied: ${settlementAmount}`);
      }

      let newStatus = "PENDING";
      if (newAmountSettled >= cn.totalAmount - 0.01) {
        newStatus = "PAID";
      } else if (newAmountSettled > 0) {
        newStatus = "PARTIALLY_PAID";
      }

      // 2. Perform Stock Adjustments (if physical return and this is the first settlement)
      if (cn.amountSettled === 0 && cn.items && cn.items.length > 0) {
        for (const item of cn.items) {
          const warehouses = await tx.warehouse.findMany({ take: 1 });
          const warehouseId = warehouses.length > 0 ? warehouses[0].id : 1;

          if (item.disposition === "SALABLE") {
            const existingInventory = await tx.inventory.findFirst({
              where: { batchId: item.batchId, warehouseId }
            });

            if (existingInventory) {
              const updatedInv = await tx.inventory.update({
                where: { id: existingInventory.id },
                data: { quantity: existingInventory.quantity + item.quantity }
              });

              await tx.stockMovement.create({
                data: {
                  inventoryId: updatedInv.id,
                  quantity: item.quantity,
                  movementType: "INWARD",
                  remarks: `Sales Return Credit Note ${cn.cnNo}`
                }
              });
            } else {
              const newInv = await tx.inventory.create({
                data: {
                  batchId: item.batchId,
                  warehouseId,
                  quantity: item.quantity
                }
              });

              await tx.stockMovement.create({
                data: {
                  inventoryId: newInv.id,
                  quantity: item.quantity,
                  movementType: "INWARD",
                  remarks: `Sales Return Credit Note ${cn.cnNo}`
                }
              });
            }

            // Increment batch stock
            const existingBatch = await tx.batch.findUnique({ where: { id: item.batchId } });
            if (existingBatch) {
              await tx.batch.update({
                where: { id: item.batchId },
                data: { quantity: existingBatch.quantity + item.quantity }
              });
            }

          } else {
            // EXPIRED_DUMP or DESTRUCTION: route to dump warehouse if exists, otherwise default warehouse
            let dumpWarehouse = await tx.warehouse.findFirst({
              where: { name: { contains: "dump", mode: "insensitive" } }
            });
            
            if (!dumpWarehouse) {
              dumpWarehouse = warehouses.length > 0 ? warehouses[0] : null;
            }

            if (dumpWarehouse) {
              const existingInventory = await tx.inventory.findFirst({
                where: { batchId: item.batchId, warehouseId: dumpWarehouse.id }
              });

              const currentQty = existingInventory ? existingInventory.quantity : 0;
              const targetInvId = existingInventory ? existingInventory.id : (await tx.inventory.create({
                data: {
                  batchId: item.batchId,
                  warehouseId: dumpWarehouse.id,
                  quantity: 0
                }
              })).id;

              await tx.inventory.update({
                where: { id: targetInvId },
                data: { quantity: currentQty + item.quantity }
              });

              await tx.stockMovement.create({
                data: {
                  inventoryId: targetInvId,
                  quantity: item.quantity,
                  movementType: "INWARD",
                  remarks: `Expired/Damaged Return Credit Note ${cn.cnNo} (${item.disposition})`
                }
              });
            }
          }
        }
      }

      // 3. Post to Retailer Ledger
      if (cn.retailerId) {
        const lastLedger = await tx.ledger.findFirst({
          where: { retailerId: cn.retailerId },
          orderBy: { createdAt: "desc" }
        });

        const previousBalance = lastLedger ? lastLedger.balance : 0.0;
        const newBalance = previousBalance - settlementAmount;

        await tx.ledger.create({
          data: {
            retailerId: cn.retailerId,
            transactionType: "CREDIT_NOTE_SETTLEMENT",
            referenceNumber: cn.cnNo,
            credit: settlementAmount,
            debit: 0.0,
            balance: newBalance,
            remarks: remarks || `Credit Note Settlement - ${cn.reason}`
          }
        });
      }

      // 4. Update the Credit Note status and amountSettled
      const updatedCn = await tx.creditNote.update({
        where: { id: creditNoteId },
        data: {
          amountSettled: newAmountSettled,
          status: newStatus,
          approvedByUserId: approvedByUserId || undefined,
          approvedAt: approvedByUserId ? new Date() : undefined
        },
        include: {
          items: {
            include: {
              product: true,
              batch: true
            }
          },
          retailer: true,
          distributor: true,
          mr: true
        }
      });

      return updatedCn;
    });
  }
}

module.exports = new CreditNoteRepository();
