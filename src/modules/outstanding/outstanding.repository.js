const prisma =
  require("../../config/db");

const getOutstandingByRetailerRepo =
  async (retailerId) => {

    const retailer =
      await prisma.retailer.findUnique({
        where: {
          id: retailerId,
        },
      });

    if (!retailer) {
      throw new Error(
        "Retailer not found"
      );
    }

    const ledgers =
      await prisma.ledger.findMany({
        where: {
          retailerId,
        },
      });

    const totalDebit =
      ledgers.reduce(
        (sum, item) =>
          sum + item.debit,
        0
      );

    const totalCredit =
      ledgers.reduce(
        (sum, item) =>
          sum + item.credit,
        0
      );

    const outstanding =
      totalDebit - totalCredit;

    return {
      retailerId,
      retailerName:
        retailer.name,
      totalDebit,
      totalCredit,
      outstanding,
    };
  };

module.exports = {
  getOutstandingByRetailerRepo,
};