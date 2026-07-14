const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createPackingType = async (data) => {
  return await prisma.packingType.create({ data });
};

const getPackingTypes = async () => {
  return await prisma.packingType.findMany({
    orderBy: { createdAt: "desc" },
  });
};

const getPackingTypeById = async (id) => {
  return await prisma.packingType.findUnique({
    where: { id },
  });
};

const updatePackingType = async (id, data) => {
  return await prisma.packingType.update({
    where: { id },
    data,
  });
};

const deletePackingType = async (id) => {
  return await prisma.packingType.delete({
    where: { id },
  });
};

module.exports = {
  createPackingType,
  getPackingTypes,
  getPackingTypeById,
  updatePackingType,
  deletePackingType,
};