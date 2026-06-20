const repository =
  require("./chemist.repository");

const createChemistService =
  async (data) => {
    return repository.createChemistRepo(
      data
    );
  };

const getChemistsService =
  async () => {
    return repository.getChemistsRepo();
  };

const getChemistByIdService =
  async (id) => {
    return repository.getChemistByIdRepo(
      id
    );
  };

const updateChemistService =
  async (id, data) => {
    return repository.updateChemistRepo(
      id,
      data
    );
  };

const deleteChemistService =
  async (id) => {
    return repository.deleteChemistRepo(
      id
    );
  };

module.exports = {
  createChemistService,
  getChemistsService,
  getChemistByIdService,
  updateChemistService,
  deleteChemistService,
};