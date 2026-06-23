const service =
  require("./doctorVisit.service");

const createDoctorVisit =
  async (req, res) => {

    console.log(
      "Doctor Visit Request:",
      req.body
    );

    try {

      const result =
        await service.createDoctorVisitService(
          req.body
        );

      res.status(201).json({
        success: true,
        data: result,
      });

    } catch (error) {

      console.error(
        "Doctor Visit Error:"
      );

      console.error(error);

      res.status(400).json({
        success: false,
        message: error.message,
      });

    }

  };

const getDoctorVisits =
  async (req, res) => {
    try {

      const result =
        await service.getDoctorVisitsService();

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

const getDoctorVisitById =
  async (req, res) => {
    try {

      const result =
        await service.getDoctorVisitByIdService(
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

const updateDoctorVisit =
  async (req, res) => {
    try {

      const result =
        await service.updateDoctorVisitService(
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

const deleteDoctorVisit =
  async (req, res) => {
    try {

      await service.deleteDoctorVisitService(
        Number(req.params.id)
      );

      res.status(200).json({
        success: true,
        message:
          "Doctor Visit deleted successfully",
      });

    } catch (error) {

      res.status(400).json({
        success: false,
        message:
          error.message,
      });

    }
  };

const getDoctorVisitsByMR =
  async (req, res) => {
    try {

      const result =
        await service.getDoctorVisitsByMRService(
          Number(req.params.mrId)
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

const getDoctorVisitsByDoctor =
  async (req, res) => {
    try {

      const result =
        await service.getDoctorVisitsByDoctorService(
          Number(req.params.doctorId)
        );

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {

  console.error(
    "Doctor Visit Error:",
    error
  );

  res.status(400).json({
    success: false,
    message: error.message,
  });

}
  };

module.exports = {
  createDoctorVisit,
  getDoctorVisits,
  getDoctorVisitById,
  updateDoctorVisit,
  deleteDoctorVisit,
  getDoctorVisitsByMR,
  getDoctorVisitsByDoctor,
};




