const service =
require("./retailerOrder.service");

const createRetailerOrder =
async (req, res) => {
  try {

    const result =
    await service
      .createRetailerOrderService(
        req.body
      );

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