const service =
  require("./attendance.service");

const checkIn =
  async (req, res) => {

    try {

      const result =
        await service.checkInService({
          ...req.body,
          checkInTime: new Date(),
        });

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

const checkOut =
  async (req, res) => {

    try {

      const result =
        await service.checkOutService(
          Number(req.params.id),
          {
            ...req.body,
            checkOutTime:
              new Date(),
          }
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

const getAttendances =
  async (req, res) => {

    try {

      const result =
        await service.getAttendancesService();

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

const getAttendanceById =
  async (req, res) => {

    try {

      const result =
        await service.getAttendanceByIdService(
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

const getAttendanceByMR =
  async (req, res) => {

    try {

      const result =
        await service.getAttendanceByMRService(
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

module.exports = {
  checkIn,
  checkOut,
  getAttendances,
  getAttendanceById,
  getAttendanceByMR,
};