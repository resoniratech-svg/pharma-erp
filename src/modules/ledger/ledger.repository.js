const prisma =
  require("../../config/db");

const createLedgerRepo =
  async (data) => {

    return prisma.ledger.create({
      data,
      include: {
        retailer: true,
      },
    });

  };

const getLedgersRepo =
  async () => {

    return prisma.ledger.findMany({
      include: {
        retailer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  };

const getLedgerByIdRepo =
  async (id) => {

    return prisma.ledger.findUnique({
      where: { id },

      include: {
        retailer: true,
      },
    });

  };

const updateLedgerRepo =
  async (id, data) => {

    return prisma.ledger.update({
      where: { id },
      data,
    });

  };

const deleteLedgerRepo =
  async (id) => {

    return prisma.ledger.delete({
      where: { id },
    });

  };

module.exports = {
  createLedgerRepo,
  getLedgersRepo,
  getLedgerByIdRepo,
  updateLedgerRepo,
  deleteLedgerRepo,
};