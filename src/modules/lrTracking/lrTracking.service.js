const repository = require(
  "./lrTracking.repository"
);

const createLRTrackingService =
  async (data) => {
    return repository
      .createLRTrackingRepo(data);
  };

const getAllLRTrackingService =
  async () => {
    return repository
      .getAllLRTrackingRepo();
  };

const getLRTrackingByIdService =
  async (id) => {
    return repository
      .getLRTrackingByIdRepo(id);
  };

const updateLRStatusService =
  async (
    id,
    status
  ) => {
    return repository
      .updateLRStatusRepo(
        id,
        status
      );
  };

module.exports = {
  createLRTrackingService,
  getAllLRTrackingService,
  getLRTrackingByIdService,
  updateLRStatusService,
};