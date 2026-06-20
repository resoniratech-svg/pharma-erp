const service = require(
  "./stockist.service"
);

const createStockist =
  async (req, res) => {
    try {

      const result =
        await service
          .createStockistService(
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

const getAllStockists =
  async (req, res) => {
    try {

      const result =
        await service
          .getAllStockistsService();

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

const getStockistById =
  async (req, res) => {
    try {

      const result =
        await service
          .getStockistByIdService(
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

const updateStockist =
  async (req, res) => {
    try {

      const result =
        await service
          .updateStockistService(
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

const deleteStockist =
  async (req, res) => {
    try {

      await service
        .deleteStockistService(
          Number(req.params.id)
        );

      res.status(200).json({
        success: true,
        message:
          "Stockist deleted successfully",
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message,
      });

    }
  };

module.exports = {
  createStockist,
  getAllStockists,
  getStockistById,
  updateStockist,
  deleteStockist,
};