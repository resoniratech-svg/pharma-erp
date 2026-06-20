const service =
  require("./invoice.service");

const createInvoice =
  async (req, res) => {

    try {

      const result =
        await service
          .createInvoiceService(
            req.body
          );

      res.status(201).json({
        success: true,
        data: result,
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message,
      });

    }
  };

const getInvoices =
  async (req, res) => {

    try {

      const result =
        await service
          .getInvoicesService();

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message,
      });

    }
  };

const getInvoiceById =
  async (req, res) => {

    try {

      const result =
        await service
          .getInvoiceByIdService(
            Number(req.params.id)
          );

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message,
      });

    }
  };

const updateInvoice =
  async (req, res) => {

    try {

      const result =
        await service
          .updateInvoiceService(
            Number(req.params.id),
            req.body
          );

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message,
      });

    }
  };

const deleteInvoice =
  async (req, res) => {

    try {

      await service
        .deleteInvoiceService(
          Number(req.params.id)
        );

      res.status(200).json({
        success: true,
        message:
          "Invoice deleted successfully",
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message,
      });

    }
  };

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};