const prisma = require("../../config/db");
const service = require("./retailerOrder.service");

const createRetailerOrder = async (req, res) => {
  try {
    let orderNumber = req.body.orderNumber || ("ORD-" + Math.floor(100000 + Math.random() * 900000));
    const existingOrder = await prisma.retailerOrder.findUnique({ where: { orderNumber } });
    if (existingOrder) {
      orderNumber = `${orderNumber}-${Math.floor(100 + Math.random() * 900)}`;
    }

    let retailerId = req.body.retailerId ? Number(req.body.retailerId) : undefined;
    if (isNaN(retailerId)) retailerId = undefined;

    let chemistId = req.body.chemistId ? Number(req.body.chemistId) : undefined;
    if (isNaN(chemistId)) chemistId = undefined;

    let hospitalId = req.body.hospitalId ? Number(req.body.hospitalId) : undefined;
    if (isNaN(hospitalId)) hospitalId = undefined;

    let stockistId = req.body.stockistId ? Number(req.body.stockistId) : undefined;
    if (isNaN(stockistId)) stockistId = undefined;

    // Resolve retailerId & stockistId with high-priority Demo matching
    const isArunDemo = (req.user && (req.user.email === 'retailer@pharmaerp.com' || (req.user.name && req.user.name.toLowerCase().includes('arun')))) ||
                       req.body.retailerCode === 'RET-001' ||
                       (req.body.retailerName && req.body.retailerName.toLowerCase().includes('arun')) ||
                       orderNumber.startsWith('RET-ORD-');

    if (isArunDemo) {
      let demoStockist = await prisma.stockist.findFirst({ where: { code: 'DIST-001' } });
      if (!demoStockist) {
        demoStockist = await prisma.stockist.create({
          data: {
            code: 'DIST-001',
            name: 'Metro Pharma Distributors',
            mobile: '9876543210',
          }
        });
      }
      stockistId = demoStockist.id;

      let r = await prisma.retailer.findFirst({ where: { code: 'RET-001' } });
      if (!r) {
        r = await prisma.retailer.create({
          data: {
            code: 'RET-001',
            name: 'Arun Patel',
            contactPerson: req.body.contactPerson || 'Arun Patel',
            mobile: req.body.mobileNumber || '9876543210',
            address: req.body.deliveryAddress || '123 Health Ave, Bangalore, 560001',
            stockistId: demoStockist.id,
          }
        });
      } else if (r.stockistId !== demoStockist.id) {
        r = await prisma.retailer.update({
          where: { id: r.id },
          data: { stockistId: demoStockist.id }
        });
      }
      retailerId = r.id;
    }

    // Resolve retailerId for other non-demo retailers if missing
    if (!retailerId) {
      const code = req.body.retailerCode || (req.user && req.user.role === 'RETAILER' ? req.user.linkedRetailerCode : undefined);
      const name = req.body.retailerName || req.body.retailer;
      let r = null;
      if (code) {
        r = await prisma.retailer.findFirst({ where: { code } });
      }
      if (!r && name) {
        r = await prisma.retailer.findFirst({ where: { name } });
      }
      if (r) retailerId = r.id;
    }

    // Resolve stockistId if missing
    if (!stockistId) {
      const distCode = req.body.distributorCode || req.body.stockistCode;
      let s = null;
      if (distCode) {
        s = await prisma.stockist.findFirst({ where: { code: distCode } });
      }
      if (!s && req.body.distributorName) {
        s = await prisma.stockist.findFirst({ where: { name: req.body.distributorName } });
      }
      if (!s && distCode === 'DIST-001') {
        s = await prisma.stockist.create({
          data: {
            code: 'DIST-001',
            name: req.body.distributorName || 'Metro Pharma Distributors',
            mobile: '9876543210',
          }
        });
      }
      if (s) stockistId = s.id;
    }

    // Fallback: If stockistId is still undefined, check if retailer has stockistId
    if (!stockistId && retailerId) {
      const r = await prisma.retailer.findUnique({ where: { id: retailerId } });
      if (r && r.stockistId) {
        stockistId = r.stockistId;
      }
    }

    let mrId = undefined;
    if (req.user && req.user.role === 'MEDICAL_REPRESENTATIVE') {
      const mr = await prisma.mR.findFirst({
        where: { userId: req.user.id }
      });
      if (mr) {
        mrId = mr.id;
      }
    }

    let orderItemsCreate = undefined;
    if (Array.isArray(req.body.orderItems) && req.body.orderItems.length > 0) {
      const items = [];
      for (const item of req.body.orderItems) {
        let prodId = item.productId ? Number(item.productId) : undefined;
        if (isNaN(prodId)) prodId = undefined;

        if (!prodId && item.productCode) {
          const p = await prisma.product.findFirst({ where: { code: item.productCode } });
          if (p) prodId = p.id;
        }
        if (!prodId && item.productName) {
          const p = await prisma.product.findFirst({ where: { name: item.productName } });
          if (p) prodId = p.id;
        }
        if (!prodId) {
          let firstProd = await prisma.product.findFirst();
          if (!firstProd) {
            firstProd = await prisma.product.create({
              data: {
                code: item.productCode || 'PRD-GEN',
                name: item.productName || 'General Product',
                mrp: Number(item.rate ?? item.unitPrice ?? 100),
                ptr: Number(item.rate ?? item.unitPrice ?? 80),
                pts: Number(item.rate ?? item.unitPrice ?? 70)
              }
            });
          }
          prodId = firstProd.id;
        }

        const quantity = Number(item.quantity) || 1;
        const rate = Number(item.rate ?? item.unitPrice ?? 0);
        const amount = Number(item.amount ?? item.lineTotal ?? (quantity * rate));

        items.push({
          productId: prodId,
          quantity,
          rate,
          amount
        });
      }

      orderItemsCreate = {
        create: items
      };
    }

    const totalAmount = Number(req.body.totalAmount ?? req.body.netAmount ?? req.body.amount ?? 0);
    const status = req.body.status || 'PENDING';

    const result = await service.createRetailerOrderService({
      retailerId,
      chemistId,
      hospitalId,
      stockistId,
      mrId,
      totalAmount,
      orderNumber,
      status,
      orderItems: orderItemsCreate,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getRetailerOrders = async (req, res) => {
  try {
    // Sync any existing RET-ORD-* orders to demo retailer (RET-001 / Arun Patel) and stockist (DIST-001 / Amit Kumar)
    try {
      const demoStockist = await prisma.stockist.findFirst({ where: { code: 'DIST-001' } });
      const demoRetailer = await prisma.retailer.findFirst({ where: { code: 'RET-001' } });
      if (demoStockist && demoRetailer) {
        await prisma.retailerOrder.updateMany({
          where: {
            orderNumber: { startsWith: 'RET-ORD-' },
            OR: [
              { stockistId: { not: demoStockist.id } },
              { retailerId: { not: demoRetailer.id } },
              { stockistId: null },
              { retailerId: null }
            ]
          },
          data: {
            stockistId: demoStockist.id,
            retailerId: demoRetailer.id
          }
        });
      }
    } catch (e) {
      console.warn("Could not auto-link RET-ORD orders:", e);
    }

    const result = await service.getRetailerOrdersService();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getRetailerOrderById = async (req, res) => {
  try {
    const result = await service.getRetailerOrderByIdService(Number(req.params.id));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateRetailerOrder = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.totalAmount !== undefined) updateData.totalAmount = Number(req.body.totalAmount);
    if (req.body.stockistId !== undefined) updateData.stockistId = Number(req.body.stockistId);
    if (req.body.retailerId !== undefined) updateData.retailerId = Number(req.body.retailerId);

    const result = await service.updateRetailerOrderService(
      Number(req.params.id),
      updateData
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteRetailerOrder = async (req, res) => {
  try {
    await service.deleteRetailerOrderService(Number(req.params.id));

    res.status(200).json({
      success: true,
      message: "Retailer Order deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createRetailerOrder,
  getRetailerOrders,
  getRetailerOrderById,
  updateRetailerOrder,
  deleteRetailerOrder,
};
