const prisma = require("../../config/db");

const createBatchRepo = async (
  data
) => {
  return prisma.batch.create({
    data,
  });
};

const getBatchesRepo = async () => {
  return prisma.batch.findMany({
    include: {
      product: true,
    },
  });
};

const getBatchById = async (
  id
) => {
  return prisma.batch.findUnique({
    where: { id },
    include: {
      product: true,
    },
  });
};

const updateBatch = async (
  id,
  data
) => {
  return prisma.batch.update({
    where: { id },
    data,
  });
};

const deleteBatch = async (
  id
) => {
  return prisma.batch.delete({
    where: { id },
  });
};

module.exports = {
  createBatchRepo,
  getBatchesRepo,
  getBatchById,
  updateBatch,
  deleteBatch,
};