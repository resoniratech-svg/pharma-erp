const service =
  require("./paymentCollection.service");

const createPaymentCollection =
  async (req, res) => {
    try {
      const result =
        await service.createPaymentCollectionService(
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

const getPaymentCollections =
  async (req, res) => {
    try {
      const result =
        await service.getPaymentCollectionsService();

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

const getPaymentCollectionById =
  async (req, res) => {
    try {
      const result =
        await service.getPaymentCollectionByIdService(
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

const updatePaymentCollection =
  async (req, res) => {
    try {
      const result =
        await service.updatePaymentCollectionService(
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

const deletePaymentCollection =
  async (req, res) => {
    try {
      await service.deletePaymentCollectionService(
        Number(req.params.id)
      );

      res.status(200).json({
        success: true,
        message:
          "Payment Collection deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

module.exports = {
  createPaymentCollection,
  getPaymentCollections,
  getPaymentCollectionById,
  updatePaymentCollection,
  deletePaymentCollection,
};