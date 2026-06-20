const service =
  require("./chemist.service");

const createChemist =
  async (req, res) => {
    try {

      const result =
        await service.createChemistService(
          req.body
        );

      res.status(201).json({
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

const getChemists =
  async (req, res) => {
    try {

      const result =
        await service.getChemistsService();

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

const getChemistById =
  async (req, res) => {
    try {

      const result =
        await service.getChemistByIdService(
          Number(req.params.id)
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

const updateChemist =
  async (req, res) => {
    try {

      const result =
        await service.updateChemistService(
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
        message:
          error.message,
      });

    }
  };

const deleteChemist =
  async (req, res) => {
    try {

      await service.deleteChemistService(
        Number(req.params.id)
      );

      res.status(200).json({
        success: true,
        message:
          "Chemist deleted successfully",
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
  createChemist,
  getChemists,
  getChemistById,
  updateChemist,
  deleteChemist,
};