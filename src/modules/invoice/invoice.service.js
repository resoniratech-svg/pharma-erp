const repository =
  require("./invoice.repository");

const createInvoiceService =
  async (data) => {

    return repository
      .createInvoiceRepo(data);

  };

const getInvoicesService =
  async () => {

    return repository
      .getInvoicesRepo();

  };

const getInvoiceByIdService =
  async (id) => {

    return repository
      .getInvoiceByIdRepo(id);

  };

const updateInvoiceService =
  async (id, data) => {

    return repository
      .updateInvoiceRepo(
        id,
        data
      );

  };

const deleteInvoiceService =
  async (id) => {

    return repository
      .deleteInvoiceRepo(id);

  };

module.exports = {
  createInvoiceService,
  getInvoicesService,
  getInvoiceByIdService,
  updateInvoiceService,
  deleteInvoiceService,
};