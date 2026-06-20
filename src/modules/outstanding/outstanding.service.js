const repository =
  require("./outstanding.repository");

const getOutstandingByRetailerService =
  async (retailerId) => {

    return repository.getOutstandingByRetailerRepo(
      retailerId
    );

  };

module.exports = {
  getOutstandingByRetailerService,
};