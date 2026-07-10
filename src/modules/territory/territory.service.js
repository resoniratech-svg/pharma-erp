const repository = require("./territory.repository");

const getTerritoryBeatsService = async () => {
  return repository.getTerritoryBeatsRepo();
};

module.exports = {
  getTerritoryBeatsService,
};
