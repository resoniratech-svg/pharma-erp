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

module.exports = {
  createTransportChallanService,
  getTransportChallansService,
  getTransportChallanByIdService,
};