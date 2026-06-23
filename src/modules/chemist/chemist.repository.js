const prisma =
  require("../../config/db");

const createChemistRepo =
  async (data) => {
    return prisma.chemist.create({
      data,
    });
  };

const getChemistsRepo =
  async () => {
    return prisma.chemist.findMany({
      orderBy: {
        id: "desc",
      },
    });
  };

const getChemistByIdRepo =
  async (id) => {
    return prisma.chemist.findUnique({
      where: { id },
    });
  };

const updateChemistRepo =
  async (id, data) => {
    return prisma.chemist.update({
      where: { id },
      data,
    });
  };

const deleteChemistRepo =
  async (id) => {
    return prisma.chemist.delete({
      where: { id },
    });
  };
  
  const findChemistByMobileRepo = async (mobile) => {
  return prisma.chemist.findFirst({
    where: {
      mobile,
    },
  });
};

module.exports = {
  createChemistRepo,
  getChemistsRepo,
  getChemistByIdRepo,
  updateChemistRepo,
  deleteChemistRepo,
  findChemistByMobileRepo
};