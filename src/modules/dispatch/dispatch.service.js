const repository =
require("./dispatch.repository");

const createDispatchService =
async (data) => {

  return repository
    .createDispatchRepo(data);

};

const getDispatchesService =
async () => {

  return repository
    .getDispatchesRepo();

};

const getDispatchByIdService =
async (id) => {

  return repository
    .getDispatchByIdRepo(id);

};

module.exports = {
  createDispatchService,
  getDispatchesService,
  getDispatchByIdService,
};