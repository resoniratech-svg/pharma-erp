const prisma = require("../../config/db");

const getTerritoryBeatsRepo = async () => {
  return prisma.territoryBeat.findMany();
};

module.exports = {
  getTerritoryBeatsRepo,
};
