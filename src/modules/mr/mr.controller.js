const service =
  require("./mr.service");

const createMR =
  async (req, res) => {
    try {

      const result =
        await service.createMRService(
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

const getMRs =
  async (req, res) => {
    try {

      const result =
        await service.getMRsService();

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

const getMRById =
  async (req, res) => {
    try {

      const result =
        await service.getMRByIdService(
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

const updateMR =
  async (req, res) => {
    try {

      const result =
        await service.updateMRService(
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

const deleteMR =
  async (req, res) => {
    try {

      await service.deleteMRService(
        Number(req.params.id)
      );

      res.status(200).json({
        success: true,
        message:
          "MR deleted successfully",
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
  createMR,
  getMRs,
  getMRById,
  updateMR,
  deleteMR,
};