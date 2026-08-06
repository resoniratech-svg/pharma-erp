const repository = require("./exportOrder.repository");

const createExportOrderService = async (data) => {
  if (!data.orderNumber) {
    // Generate order number if not provided
    const timestamp = Date.now().toString().slice(-6);
    data.orderNumber = `EXP-ORD-2026-${timestamp}`;
  }

  // Calculate INR equivalent if orderValueUSD is provided and orderValueINR is not
  if (data.orderValueUSD && !data.orderValueINR) {
    data.orderValueINR = Math.round(Number(data.orderValueUSD) * 83.2); // standard FX benchmark
  } else if (data.orderValueINR && !data.orderValueUSD) {
    data.orderValueUSD = Math.round(Number(data.orderValueINR) / 83.2);
  }

  if (data.orderDate) {
    data.orderDate = new Date(data.orderDate);
  }
  if (data.eta) {
    data.eta = new Date(data.eta);
  }

  if (data.orderValueUSD) data.orderValueUSD = Number(data.orderValueUSD);
  if (data.orderValueINR) data.orderValueINR = Number(data.orderValueINR);

  return repository.createExportOrderRepo(data);
};

const getExportOrdersService = async (filters) => {
  return repository.getExportOrdersRepo(filters);
};

const getExportOrderByIdService = async (id) => {
  const order = await repository.getExportOrderByIdRepo(id);
  if (!order) {
    throw new Error(`Export order with ID ${id} not found`);
  }
  return order;
};

const updateExportOrderService = async (id, data) => {
  if (data.orderDate) {
    data.orderDate = new Date(data.orderDate);
  }
  if (data.eta) {
    data.eta = new Date(data.eta);
  }
  if (data.orderValueUSD !== undefined) data.orderValueUSD = Number(data.orderValueUSD);
  if (data.orderValueINR !== undefined) data.orderValueINR = Number(data.orderValueINR);

  return repository.updateExportOrderRepo(id, data);
};

const deleteExportOrderService = async (id) => {
  return repository.deleteExportOrderRepo(id);
};

module.exports = {
  createExportOrderService,
  getExportOrdersService,
  getExportOrderByIdService,
  updateExportOrderService,
  deleteExportOrderService,
};
