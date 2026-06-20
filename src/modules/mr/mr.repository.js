const prisma =
  require("../../config/db");

const createMRRepo =
  async (data) => {
    return prisma.mR.create({
      data,
    });
  };

const getMRsRepo =
  async () => {
    return prisma.mR.findMany({
      orderBy: {
        id: "desc",
      },
    });
  };

const getMRByIdRepo =
  async (id) => {
    return prisma.mR.findUnique({
      where: { id },
    });
  };

const updateMRRepo =
  async (id, data) => {
    return prisma.mR.update({
      where: { id },
      data,
    });
  };

const deleteMRRepo =
  async (id) => {
    return prisma.mR.delete({
      where: { id },
    });
  };

module.exports = {
  createMRRepo,
  getMRsRepo,
  getMRByIdRepo,
  updateMRRepo,
  deleteMRRepo,
};