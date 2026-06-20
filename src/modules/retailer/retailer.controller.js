const service =
  require("./retailer.service");

const createRetailer =
  async (req, res) => {
    try {

      const result =
        await service
          .createRetailerService(
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

const getRetailers =
  async (req, res) => {
    try {

      const result =
        await service
          .getRetailersService();

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

const getRetailerById =
  async (req, res) => {
    try {

      const result =
        await service
          .getRetailerByIdService(
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

const updateRetailer =
  async (req, res) => {
    try {

      const result =
        await service
          .updateRetailerService(
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

const deleteRetailer =
  async (req, res) => {
    try {

      await service
        .deleteRetailerService(
          Number(req.params.id)
        );

      res.status(200).json({
        success: true,
        message:
          "Retailer deleted successfully",
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message,
      });

    }
  };

const getRetailersByStockist =
  async (req, res) => {
    try {

      const result =
        await service
          .getRetailersByStockistService(
            Number(
              req.params.stockistId
            )
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
  createRetailer,
  getRetailers,
  getRetailerById,
  updateRetailer,
  deleteRetailer,
  getRetailersByStockist,
};