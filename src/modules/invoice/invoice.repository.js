const prisma =
  require("../../config/db");

const createInvoiceRepo =
  async (data) => {

    return prisma.invoice.create({
      data,
      include: {
        retailer: true,
        invoiceItems: true,
      },
    });

  };

const getInvoicesRepo =
  async () => {

    return prisma.invoice.findMany({
      include: {
        retailer: true,
        invoiceItems: {
          include: {
            product: true,
          },
        },
      },
    });

  };

const getInvoiceByIdRepo =
  async (id) => {

    return prisma.invoice.findUnique({
      where: { id },

      include: {
        retailer: true,

        invoiceItems: {
          include: {
            product: true,
          },
        },
      },
    });

  };

const updateInvoiceRepo =
  async (id, data) => {

    return prisma.invoice.update({
      where: { id },
      data,
    });

  };

const deleteInvoiceRepo =
  async (id) => {

    return prisma.invoice.delete({
      where: { id },
    });

  };

module.exports = {
  createInvoiceRepo,
  getInvoicesRepo,
  getInvoiceByIdRepo,
  updateInvoiceRepo,
  deleteInvoiceRepo,
};