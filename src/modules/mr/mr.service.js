const repository =
  require("./mr.repository");

const createMRService =
  async (data) => {
    return repository.createMRRepo(
      data
    );
  };

const getMRsService =
  async () => {
    return repository.getMRsRepo();
  };

const getMRByIdService =
  async (id) => {
    return repository.getMRByIdRepo(
      id
    );
  };

const updateMRService =
  async (id, data) => {
    return repository.updateMRRepo(
      id,
      data
    );
  };

const deleteMRService =
  async (id) => {
    return repository.deleteMRRepo(
      id
    );
  };

module.exports = {
  createMRService,
  getMRsService,
  getMRByIdService,
  updateMRService,
  deleteMRService,
};