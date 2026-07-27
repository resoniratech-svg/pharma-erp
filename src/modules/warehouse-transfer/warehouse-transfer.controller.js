const service = require('./warehouse-transfer.service');

const createWarehouseTransfer = async (req, res, next) => {
  try {
    const warehouseTransfer = await service.createWarehouseTransfer(req.body);
    res.status(201).json(warehouseTransfer);
  } catch (error) {
    next(error);
  }
};

const getWarehouseTransfers = async (req, res, next) => {
  try {
    const warehouseTransfers = await service.getWarehouseTransfers();
    res.status(200).json(warehouseTransfers);
  } catch (error) {
    next(error);
  }
};

const getWarehouseTransferById = async (req, res, next) => {
  try {
    const warehouseTransfer = await service.getWarehouseTransferById(Number(req.params.id));
    if (!warehouseTransfer) {
      return res.status(404).json({ message: 'WarehouseTransfer not found' });
    }
    res.status(200).json(warehouseTransfer);
  } catch (error) {
    next(error);
  }
};

const updateWarehouseTransfer = async (req, res, next) => {
  try {
    const warehouseTransfer = await service.updateWarehouseTransfer(Number(req.params.id), req.body);
    res.status(200).json(warehouseTransfer);
  } catch (error) {
    next(error);
  }
};

const deleteWarehouseTransfer = async (req, res, next) => {
  try {
    await service.deleteWarehouseTransfer(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWarehouseTransfer,
  getWarehouseTransfers,
  getWarehouseTransferById,
  updateWarehouseTransfer,
  deleteWarehouseTransfer
};
