const prisma =
  require("../../config/db");

const createRetailerOrderRepo =
  async (data) => {

    return prisma.retailerOrder.create({
      data,

      include: {
        retailer: true,
        chemist: true,
        hospital: true,
        stockist: true,
        orderItems: true,
      },
    });

  };

const getRetailerOrdersRepo =
  async () => {

    return prisma.retailerOrder.findMany({
      include: {
        retailer: true,
        chemist: true,
        hospital: true,
        stockist: true,
        orderItems: {
          include: {
            product: true
          }
        },
      },
      orderBy: {
        id: 'desc'
      }
    });

  };

const getRetailerOrderByIdRepo =
  async (id) => {

    return prisma.retailerOrder.findUnique({
      where: { id },

      include: {
        retailer: true,
        chemist: true,
        hospital: true,
        stockist: true,
        orderItems: {
          include: {
            product: true
          }
        },
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
    return prisma.$transaction(async (tx) => {
      await tx.retailerOrderItem.deleteMany({
        where: { retailerOrderId: id }
      });
      return tx.retailerOrder.delete({
        where: { id },
      });
    });
  };

module.exports = {
  createRetailerOrderRepo,
  getRetailerOrdersRepo,
  getRetailerOrderByIdRepo,
  updateRetailerOrderRepo,
  deleteRetailerOrderRepo,
};