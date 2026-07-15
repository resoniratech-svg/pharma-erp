const prisma = require("../../config/db");
const service = require("./retailerOrder.service");

const createRetailerOrder = async (req, res) => {
  try {
    const orderNumber = "ORD-" + Math.floor(100000 + Math.random() * 900000);

    let retailerId = req.body.retailerId ? Number(req.body.retailerId) : undefined;
    let chemistId = req.body.chemistId ? Number(req.body.chemistId) : undefined;
    let hospitalId = req.body.hospitalId ? Number(req.body.hospitalId) : undefined;
    let stockistId = req.body.stockistId ? Number(req.body.stockistId) : undefined;

    let mrId = undefined;
    if (req.user && req.user.role === 'MEDICAL_REPRESENTATIVE') {
      const mr = await prisma.mR.findFirst({
        where: { userId: req.user.id }
      });
      if (mr) {
        mrId = mr.id;
      }
    }

    const orderItemsCreate = Array.isArray(req.body.orderItems)
      ? {
          create: req.body.orderItems.map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            rate: Number(item.rate),
            amount: Number(item.amount),
          })),
        }
      : undefined;

    const result = await service.createRetailerOrderService({
      retailerId,
      chemistId,
      hospitalId,
      stockistId,
      mrId,
      totalAmount: Number(req.body.totalAmount),
      orderNumber,
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

const getRetailerOrders =
async (req, res) => {
  try {

    const result =
    await service
      .getRetailerOrdersService();

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

const getRetailerOrderById =
async (req, res) => {
  try {

    const result =
    await service
      .getRetailerOrderByIdService(
        Number(req.params.id)
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

const updateRetailerOrder =
async (req, res) => {
  try {

    const result =
    await service
      .updateRetailerOrderService(
        Number(req.params.id),
        req.body
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

const deleteRetailerOrder =
async (req, res) => {
  try {

    await service
      .deleteRetailerOrderService(
        Number(req.params.id)
      );

    res.status(200).json({
      success: true,
      message:
      "Retailer Order deleted successfully",
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