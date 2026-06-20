const prisma = require("../../config/db");

const createLRTrackingRepo = async (data) => {
  return prisma.lRTracking.create({
    data,
  });
};

const getAllLRTrackingRepo = async () => {
  return prisma.lRTracking.findMany({
    include: {
      transportChallan: true,
    },
  });
};

const getLRTrackingByIdRepo = async (id) => {
  return prisma.lRTracking.findUnique({
    where: { id },

    include: {
      transportChallan: true,
    },
  });
};

const updateLRStatusRepo = async (
  id,
  status
) => {
  return prisma.lRTracking.update({
    where: { id },

    data: {
      status,
    },
  });
};

module.exports = {
  createLRTrackingRepo,
  getAllLRTrackingRepo,
  getLRTrackingByIdRepo,
  updateLRStatusRepo,
};