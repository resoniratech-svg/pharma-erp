const service =
  require("./ledger.service");

const createLedger =
  async (req, res) => {
    try {

      const result =
        await service
          .createLedgerService(
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

const getLedgers =
  async (req, res) => {
    try {

      const result =
        await service
          .getLedgersService();

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

const getLedgerById =
  async (req, res) => {
    try {

      const result =
        await service
          .getLedgerByIdService(
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

const updateLedger =
  async (req, res) => {
    try {

      const result =
        await service
          .updateLedgerService(
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

const deleteLedger =
  async (req, res) => {
    try {

      await service
        .deleteLedgerService(
          Number(req.params.id)
        );

      res.status(200).json({
        success: true,
        message:
          "Ledger deleted successfully",
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message,
      });

    }
  };

module.exports = {
  createLedger,
  getLedgers,
  getLedgerById,
  updateLedger,
  deleteLedger,
};