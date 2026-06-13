const prisma = require("../../config/db");

const getModules = async () => {
  return prisma.module.findMany();
};

module.exports = {
  getModules,
};