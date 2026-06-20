const service = require(
  "./deliveryTracking.service"
);

const createDeliveryTracking =
  async (req, res) => {
    try {

      const result =
        await service
          .createDeliveryTrackingService(
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

const getAllDeliveryTracking =
  async (req, res) => {
    try {

      const result =
        await service
          .getAllDeliveryTrackingService();

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

const getDeliveryTrackingById =
  async (req, res) => {
    try {

      const result =
        await service
          .getDeliveryTrackingByIdService(
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

module.exports = {
  createDeliveryTracking,
  getAllDeliveryTracking,
  getDeliveryTrackingById,
};  