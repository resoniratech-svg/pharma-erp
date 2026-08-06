const prisma = require("../../config/db");

const createExportOrderRepo = async (data) => {
  return prisma.exportOrder.create({
    data,
  });
};

const getExportOrdersRepo = async (filters = {}) => {
  const where = {};
  if (filters.destinationCountry) {
    where.destinationCountry = filters.destinationCountry;
  }
  if (filters.shippingMode) {
    where.shippingMode = filters.shippingMode;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.customsStatus) {
    where.customsStatus = filters.customsStatus;
  }

  return prisma.exportOrder.findMany({
    where,
    orderBy: {
      id: "desc",
    },
  });
};

const getExportOrderByIdRepo = async (id) => {
  return prisma.exportOrder.findUnique({
    where: { id },
  });
};

const updateExportOrderRepo = async (id, data) => {
  return prisma.exportOrder.update({
    where: { id },
    data,
  });
};

const deleteExportOrderRepo = async (id) => {
  return prisma.exportOrder.delete({
    where: { id },
  });
};

module.exports = {
  createExportOrderRepo,
  getExportOrdersRepo,
  getExportOrderByIdRepo,
  updateExportOrderRepo,
  deleteExportOrderRepo,
};
