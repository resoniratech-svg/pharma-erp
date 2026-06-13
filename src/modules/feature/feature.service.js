const prisma = require("../../config/db");

const getFeatures = async () => {
  return prisma.feature.findMany({
    include: {
      module: true,
    },
  });
};

module.exports = {
  getFeatures,
};