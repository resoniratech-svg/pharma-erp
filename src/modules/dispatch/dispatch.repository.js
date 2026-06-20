const prisma = require("../../config/db");

const createDispatchRepo = async (
  data
) => {
  return prisma.dispatch.create({
    data,
  });
};

const getDispatchesRepo =
  async () => {
    return prisma.dispatch.findMany({
      include: {
        batch: true,
        warehouse: true,
      },
    });
  };

const getDispatchByIdRepo =
  async (id) => {
    return prisma.dispatch.findUnique({
      where: { id },
      include: {
        batch: true,
        warehouse: true,
      },
    });
  };

module.exports = {
  createDispatchRepo,
  getDispatchesRepo,
  getDispatchByIdRepo,
};