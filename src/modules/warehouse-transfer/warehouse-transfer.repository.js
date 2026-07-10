const prisma = require('../../config/db');

const create = async (data) => {
  return prisma.warehouseTransfer.create({
    data: {
      ...data,
      items: {
        create: data.items
      }
    },
    include: {
      items: true
    }
  });
};

const findAll = async () => {
  return prisma.warehouseTransfer.findMany({
    include: {
      items: true
    }
  });
};

const findById = async (id) => {
  return prisma.warehouseTransfer.findUnique({
    where: { id },
    include: {
      items: true
    }
  });
};

const update = async (id, data) => {
  return prisma.warehouseTransfer.update({
    where: { id },
    data,
    include: {
      items: true
    }
  });
};

const remove = async (id) => {
  return prisma.warehouseTransfer.delete({
    where: { id }
  });
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove
};
