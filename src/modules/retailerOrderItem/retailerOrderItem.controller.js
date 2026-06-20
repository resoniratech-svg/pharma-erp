const retailerOrderItemService =
  require("./retailerOrderItem.service");

const createRetailerOrderItem =
  async (req, res) => {
    try {

      const result =
        await retailerOrderItemService
          .createRetailerOrderItemService(
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

const getRetailerOrderItems =
  async (req, res) => {
    try {

      const result =
        await retailerOrderItemService
          .getRetailerOrderItemsService();

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

const getRetailerOrderItemById =
  async (req, res) => {
    try {

      const result =
        await retailerOrderItemService
          .getRetailerOrderItemByIdService(
            Number(req.params.id)
          );

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "Retailer Order Item not found",
        });
      }

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

const updateRetailerOrderItem =
  async (req, res) => {
    try {

      const result =
        await retailerOrderItemService
          .updateRetailerOrderItemService(
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

const deleteRetailerOrderItem =
  async (req, res) => {
    try {

      await retailerOrderItemService
        .deleteRetailerOrderItemService(
          Number(req.params.id)
        );

      res.status(200).json({
        success: true,
        message:
          "Retailer Order Item deleted successfully",
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message: error.message,
      });

    }
  };

module.exports = {
  createRetailerOrderItem,
  getRetailerOrderItems,
  getRetailerOrderItemById,
  updateRetailerOrderItem,
  deleteRetailerOrderItem,
};