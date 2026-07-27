const outwardStockRepository = require('./outward-stock.repository');
const prisma = require('../../config/db');

class OutwardStockService {
  async createOutwardStock(data) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create OutwardStock record
      const {
        items,
        itemsCount,
        totalQuantity,
        totalValue,
        transporter,
        lrNumber,
        vehicleNumber,
        driverName,
        driverMobile,
        expectedDeliveryDate,
        ...outwardStockData
      } = data;
      
      const outward = await tx.outwardStock.create({
        data: {
          ...outwardStockData,
          transporter,
          lrNumber,
          vehicleNumber,
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
          itemsCount: itemsCount || items.length,
          totalQuantity: totalQuantity || items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
          totalValue: totalValue || items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.rate) || 0)), 0),
          items: {
            create: items.map(i => ({
              productId: Number(i.productId),
              batchId: Number(i.batchId),
              quantity: Number(i.quantity),
              rate: Number(i.rate)
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true,
              batch: true
            }
          },
          warehouse: true
        }
      });

      // 2. Map products list
      const productsJson = outward.items.map(item => ({
        productId: item.productId,
        productCode: item.product?.code || `PRD-${item.productId}`,
        productName: item.product?.name || "Unknown Product",
        batchId: item.batchId,
        batchNo: item.batch?.batchNumber || `BAT-${item.batchId}`,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate
      }));

      // 3. Create Dispatch in IN_TRANSIT status with logistics details
      const remarks = expectedDeliveryDate 
        ? `EXPECTED_DELIVERY_DATE: ${expectedDeliveryDate} | ${data.remarks || ''}`
        : (data.remarks || '');

      await tx.dispatch.create({
        data: {
          dispatchNo: outward.dispatchNo,
          dispatchType: "Distributor Order",
          orderId: outward.referenceNumber || "N/A",
          customerName: outward.client,
          sourceWarehouse: outward.warehouse?.name || "Main Warehouse",
          warehouseId: outward.warehouseId,
          totalItems: outward.itemsCount,
          totalQuantity: outward.totalQuantity,
          status: "IN_TRANSIT",
          transporter: transporter || "N/A",
          lrNumber: lrNumber || "N/A",
          vehicleNumber: vehicleNumber || "N/A",
          driverName: driverName || "N/A",
          driverMobile: driverMobile || "N/A",
          remarks: remarks,
          products: productsJson,
          createdBy: "System Administrator",
          createdDate: new Date().toISOString().split('T')[0]
        }
      });

      // 4. Deduct inventory at source warehouse immediately
      for (const item of productsJson) {
        const inv = await tx.inventory.findFirst({
          where: {
            warehouseId: Number(outward.warehouseId),
            batchId: Number(item.batchId)
          }
        });
        if (inv) {
          if (inv.quantity < Number(item.quantity)) {
            throw new Error(`Insufficient stock for product. Available: ${inv.quantity}, Requested: ${item.quantity}`);
          }
          const newQty = inv.quantity - Number(item.quantity);
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: newQty }
          });
          
          await tx.stockMovement.create({
            data: {
              inventoryId: inv.id,
              movementType: "OUTWARD",
              quantity: Number(item.quantity),
              remarks: `Dispatched outward under Dispatch No ${outward.dispatchNo}`
            }
          });
        }
      }

      return outward;
    });

    return result;
  }

  async getAllOutwardStocks() {
    return outwardStockRepository.findAll();
  }

  async getOutwardStockById(id) {
    return outwardStockRepository.findById(id);
  }

  async updateOutwardStock(id, data) {
    let { items, itemsCount, totalQuantity, totalValue } = data;
    
    if (items && Array.isArray(items)) {
      if (itemsCount === undefined) {
        data.itemsCount = items.length;
      }
      if (totalQuantity === undefined) {
        data.totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      }
      if (totalValue === undefined) {
        data.totalValue = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.rate) || 0)), 0);
      }
    }

    return outwardStockRepository.update(id, data);
  }

  async deleteOutwardStock(id) {
    return outwardStockRepository.delete(id);
  }
}

module.exports = new OutwardStockService();
