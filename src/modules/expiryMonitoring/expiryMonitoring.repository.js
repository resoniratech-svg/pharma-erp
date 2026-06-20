const prisma = require("../../config/db");

const getExpiringBatchesRepo = async () => {
  const today = new Date();

  const next30Days = new Date();
  next30Days.setDate(today.getDate() + 30);

  const batches = await prisma.batch.findMany({
    where: {
      expiryDate: {
        gte: today,
        lte: next30Days,
      },
    },
    include: {
      product: true,
    },
  });

  return batches.map((batch) => ({
    batchNumber: batch.batchNumber,
    productName: batch.product.name,
    expiryDate: batch.expiryDate,
    quantity: batch.quantity,
  }));
};

module.exports = {
  getExpiringBatchesRepo,
};