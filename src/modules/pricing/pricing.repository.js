const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createPricing = async (data) => {
  return await prisma.pricingMaster.create({ 
    data,
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });
};

const getPricings = async () => {
  return await prisma.pricingMaster.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });
};

const getPricingById = async (id) => {
  return await prisma.pricingMaster.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });
};

const updatePricing = async (id, data) => {
  return await prisma.pricingMaster.update({
    where: { id },
    data,
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
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