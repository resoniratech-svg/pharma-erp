const prisma = require("../../config/db");

const getDistributorsRepo = async () => {
  return prisma.distributor.findMany();
};

module.exports = {
  getDistributorsRepo,
};
