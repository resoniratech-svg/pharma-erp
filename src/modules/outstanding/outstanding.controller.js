const service =
  require("./outstanding.service");

const getOutstandingByRetailer =
  async (req, res) => {

    try {

      const result =
        await service.getOutstandingByRetailerService(
          Number(
            req.params.retailerId
          )
        );

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message:
          error.message,
      });

    }

  };

module.exports = {
  getOutstandingByRetailer,
};