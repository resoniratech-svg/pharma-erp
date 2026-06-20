const service =
  require("./doctor.service");

const createDoctor =
  async (req, res) => {
    try {

      const result =
        await service.createDoctorService(
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

const getDoctors =
  async (req, res) => {
    try {

      const result =
        await service.getDoctorsService();

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

const getDoctorById =
  async (req, res) => {
    try {

      const result =
        await service.getDoctorByIdService(
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

const updateDoctor =
  async (req, res) => {
    try {

      const result =
        await service.updateDoctorService(
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

const deleteDoctor =
  async (req, res) => {
    try {

      await service.deleteDoctorService(
        Number(req.params.id)
      );

      res.status(200).json({
        success: true,
        message:
          "Doctor deleted successfully",
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
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};