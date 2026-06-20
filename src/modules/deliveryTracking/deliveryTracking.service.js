const repository = require(
  "./deliveryTracking.repository"
);

const createDeliveryTrackingService =
  async (data) => {
    return repository
      .createDeliveryTrackingRepo(data);
  };

const getAllDeliveryTrackingService =
  async () => {
    return repository
      .getAllDeliveryTrackingRepo();
  };

const getDeliveryTrackingByIdService =
  async (id) => {
    return repository
      .getDeliveryTrackingByIdRepo(id);
  };

module.exports = {
  createDeliveryTrackingService,
  getAllDeliveryTrackingService,
  getDeliveryTrackingByIdService,
};