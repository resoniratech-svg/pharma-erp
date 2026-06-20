const repository =
  require("./paymentCollection.repository");

const createPaymentCollectionService =
  async (data) => {
    return repository.createPaymentCollectionRepo(
      data
    );
  };

const getPaymentCollectionsService =
  async () => {
    return repository.getPaymentCollectionsRepo();
  };

const getPaymentCollectionByIdService =
  async (id) => {
    return repository.getPaymentCollectionByIdRepo(
      id
    );
  };

const updatePaymentCollectionService =
  async (id, data) => {
    return repository.updatePaymentCollectionRepo(
      id,
      data
    );
  };

const deletePaymentCollectionService =
  async (id) => {
    return repository.deletePaymentCollectionRepo(
      id
    );
  };

module.exports = {
  createPaymentCollectionService,
  getPaymentCollectionsService,
  getPaymentCollectionByIdService,
  updatePaymentCollectionService,
  deletePaymentCollectionService,
};