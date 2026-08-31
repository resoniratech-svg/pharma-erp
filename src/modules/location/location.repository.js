const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getLocationsRepo = async () => {
  return prisma.locationMaster.findMany();
};

const createLocationRepo = async (data) => {
  const existing = await prisma.locationMaster.findFirst({
    where: {
      type: data.type,
      value: data.value,
      parent: data.parent || null
    }
  });
  
  if (existing) return existing;

  return prisma.locationMaster.create({
    data: {
      type: data.type,
      value: data.value,
      parent: data.parent || null
    }
  });
};

module.exports = {
  getLocationsRepo,
  createLocationRepo
};
