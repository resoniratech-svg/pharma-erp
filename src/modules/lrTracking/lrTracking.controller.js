const service = require(
  "./lrTracking.service"
);

const createLRTracking =
  async (req, res) => {
    try {

      const result =
        await service
          .createLRTrackingService(
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

const getAllLRTracking =
  async (req, res) => {
    try {

      const result =
        await service
          .getAllLRTrackingService();

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

const getLRTrackingById =
  async (req, res) => {
    try {

      const result =
        await service
          .getLRTrackingByIdService(
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

const updateLRStatus =
  async (req, res) => {
    try {

      const result =
        await service
          .updateLRStatusService(
            Number(req.params.id),
            req.body.status
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
  createLRTracking,
  getAllLRTracking,
  getLRTrackingById,
  updateLRStatus,
};