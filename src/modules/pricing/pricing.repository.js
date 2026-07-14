const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createPricing = async (data) => {
  return await prisma.pricingMaster.create({ data });
};

const getPricings = async () => {
  return await prisma.pricingMaster.findMany({
    orderBy: { createdAt: "desc" },
  });
};

const getPricingById = async (id) => {
  return await prisma.pricingMaster.findUnique({
    where: { id },
  });
};

const updatePricing = async (id, data) => {
  return await prisma.pricingMaster.update({
    where: { id },
    data,
  });
};

const deletePricing = async (id) => {
  return await prisma.pricingMaster.delete({
    where: { id },
  });
};

module.exports = {
  createPricing,
  getPricings,
  getPricingById,
  updatePricing,
  deletePricing,
};