const service =
  require("./transportChallan.service");

const createTransportChallan =
  async (req, res) => {
    try {

      const result =
        await service
          .createTransportChallanService(
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

const getTransportChallans =
  async (req, res) => {
    try {

      const result =
        await service
          .getTransportChallansService();

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

const getTransportChallanById =
  async (req, res) => {
    try {

      const result =
        await service
          .getTransportChallanByIdService(
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
  createTransportChallan,
  getTransportChallans,
  getTransportChallanById,
};