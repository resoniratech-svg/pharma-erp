const prisma = require("../../config/db");

const createTransportChallanRepo =
  async (data) => {
    return prisma.transportChallan.create({
      data,
    });
  };

const getTransportChallansRepo =
  async () => {
    return prisma.transportChallan.findMany({
      include: {
        dispatch: true,
      },
    });
  };

const getTransportChallanByIdRepo =
  async (id) => {
    return prisma.transportChallan.findUnique({
      where: { id },
      include: {
        dispatch: true,
      },
    });
  };

module.exports = {
  createTransportChallanRepo,
  getTransportChallansRepo,
  getTransportChallanByIdRepo,
};