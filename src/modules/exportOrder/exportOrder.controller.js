const service = require("./exportOrder.service");

const createExportOrder = async (req, res) => {
  try {
    const result = await service.createExportOrderService(req.body);
    res.status(201).json({
      success: true,
      data: result,
      message: "Export order created successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getExportOrders = async (req, res) => {
  try {
    const result = await service.getExportOrdersService(req.query);
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

const getExportOrderById = async (req, res) => {
  try {
    const result = await service.getExportOrderByIdService(Number(req.params.id));
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateExportOrder = async (req, res) => {
  try {
    const result = await service.updateExportOrderService(
      Number(req.params.id),
      req.body
    );
    res.status(200).json({
      success: true,
      data: result,
      message: "Export order updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteExportOrder = async (req, res) => {
  try {
    await service.deleteExportOrderService(Number(req.params.id));
    res.status(200).json({
      success: true,
      message: "Export order deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createExportOrder,
  getExportOrders,
  getExportOrderById,
  updateExportOrder,
  deleteExportOrder,
};
