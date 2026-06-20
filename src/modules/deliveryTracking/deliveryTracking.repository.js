const prisma = require("../../config/db");

const createDeliveryTrackingRepo =
  async (data) => {
    return prisma.deliveryTracking.create({
      data,
    });
  };

const getAllDeliveryTrackingRepo =
  async () => {
    return prisma.deliveryTracking.findMany({
      include: {
        lrTracking: true,
      },
    });
  };

const getDeliveryTrackingByIdRepo =
  async (id) => {
    return prisma.deliveryTracking.findUnique({
      where: { id },

      include: {
        lrTracking: true,
      },
    });
  };

module.exports = {
  createDeliveryTrackingRepo,
  getAllDeliveryTrackingRepo,
  getDeliveryTrackingByIdRepo,
};