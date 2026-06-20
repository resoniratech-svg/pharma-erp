const warehouseService = require("./warehouse.service");

const createWarehouse = async (req, res) => {
  try {
    const warehouse =
      await warehouseService.createWarehouseService(req.body);

    res.status(201).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getWarehouses = async (req, res) => {
  const data =
    await warehouseService.getWarehousesService();

  res.json({
    success: true,
    data,
  });
};

const getWarehouseById = async (req, res) => {
  try {
    const data =
      await warehouseService.getWarehouseByIdService(
        Number(req.params.id)
      );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateWarehouse = async (req, res) => {
  try {
    const data =
      await warehouseService.updateWarehouseService(
        Number(req.params.id),
        req.body
      );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteWarehouse = async (req, res) => {
  try {
    await warehouseService.deleteWarehouseService(
      Number(req.params.id)
    );

    res.json({
      success: true,
      message: "Warehouse deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
};