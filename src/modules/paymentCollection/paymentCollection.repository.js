const prisma =
  require("../../config/db");

const createPaymentCollectionRepo =
  async (data) => {
    return prisma.paymentCollection.create({
      data,
      include: {
        invoice: true,
      },
    });
  };

const getPaymentCollectionsRepo =
  async () => {
    return prisma.paymentCollection.findMany({
      include: {
        invoice: true,
      },
    });
  };

const getPaymentCollectionByIdRepo =
  async (id) => {
    return prisma.paymentCollection.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });
  };

const updatePaymentCollectionRepo =
  async (id, data) => {
    return prisma.paymentCollection.update({
      where: { id },
      data,
    });
  };

const deletePaymentCollectionRepo =
  async (id) => {
    return prisma.paymentCollection.delete({
      where: { id },
    });
  };

module.exports = {
  createPaymentCollectionRepo,
  getPaymentCollectionsRepo,
  getPaymentCollectionByIdRepo,
  updatePaymentCollectionRepo,
  deletePaymentCollectionRepo,
};