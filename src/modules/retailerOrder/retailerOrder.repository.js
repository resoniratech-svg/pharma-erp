const prisma =
  require("../../config/db");

const createRetailerOrderRepo =
  async (data) => {

    return prisma.retailerOrder.create({
      data,

      include: {
        retailer: true,
        orderItems: true,
      },
    });

  };

const getRetailerOrdersRepo =
  async () => {

    return prisma.retailerOrder.findMany({
      include: {
        retailer: true,
        orderItems: true,
      },
    });

  };

const getRetailerOrderByIdRepo =
  async (id) => {

    return prisma.retailerOrder.findUnique({
      where: { id },

      include: {
        retailer: true,
        orderItems: true,
      },
    });

  };

const updateRetailerOrderRepo =
  async (id, data) => {

    return prisma.retailerOrder.update({
      where: { id },
      data,
    });

  };

const deleteRetailerOrderRepo =
  async (id) => {

    return prisma.retailerOrder.delete({
      where: { id },
    });

  };

module.exports = {
  createRetailerOrderRepo,
  getRetailerOrdersRepo,
  getRetailerOrderByIdRepo,
  updateRetailerOrderRepo,
  deleteRetailerOrderRepo,
};