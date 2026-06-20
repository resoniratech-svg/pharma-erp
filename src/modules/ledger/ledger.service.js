const repository =
  require("./ledger.repository");

const createLedgerService =
  async (data) => {
    return repository
      .createLedgerRepo(data);
  };

const getLedgersService =
  async () => {
    return repository
      .getLedgersRepo();
  };

const getLedgerByIdService =
  async (id) => {
    return repository
      .getLedgerByIdRepo(id);
  };

const updateLedgerService =
  async (id, data) => {
    return repository
      .updateLedgerRepo(id, data);
  };

const deleteLedgerService =
  async (id) => {
    return repository
      .deleteLedgerRepo(id);
  };

module.exports = {
  createLedgerService,
  getLedgersService,
  getLedgerByIdService,
  updateLedgerService,
  deleteLedgerService,
};