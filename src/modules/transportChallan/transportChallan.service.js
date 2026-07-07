const repository =
  require("./transportChallan.repository");

const createTransportChallanService =
  async (data) => {
    return repository
      .createTransportChallanRepo(data);
  };

const getTransportChallansService =
  async () => {
    return repository
      .getTransportChallansRepo();
  };

const getTransportChallanByIdService =
  async (id) => {
    return repository
      .getTransportChallanByIdRepo(id);
  };

const updateTransportChallanService =
  async (id, data) => {
    return repository
      .updateTransportChallanRepo(id, data);
  };

module.exports = {
  createTransportChallanService,
  getTransportChallansService,
  getTransportChallanByIdService,
  updateTransportChallanService,
};