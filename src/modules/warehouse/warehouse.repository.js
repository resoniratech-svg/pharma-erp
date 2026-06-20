const prisma = require("../../config/db");

const createWarehouseRepo = (data) => {
  return prisma.warehouse.create({
    data,
  });
};

const getWarehousesRepo = () => {
  return prisma.warehouse.findMany();
};

const getWarehouseByIdRepo = (id) => {
  return prisma.warehouse.findUnique({
    where: { id },
  });
};

const updateWarehouseRepo = (id, data) => {
  return prisma.warehouse.update({
    where: { id },
    data,
  });
};

const deleteWarehouseRepo = (id) => {
  return prisma.warehouse.delete({
    where: { id },
  });
};

module.exports = {
  createWarehouseRepo,
  getWarehousesRepo,
  getWarehouseByIdRepo,
  updateWarehouseRepo,
  deleteWarehouseRepo,
};