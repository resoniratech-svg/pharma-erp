const repository =
  require("./attendance.repository");

const checkInService =
  async (data) => {

    return repository.checkInRepo(
      data
    );

  };

const checkOutService =
  async (id, data) => {

    return repository.checkOutRepo(
      id,
      data
    );

  };

const getAttendancesService =
  async () => {

    return repository.getAttendancesRepo();

  };

const getAttendanceByIdService =
  async (id) => {

    return repository.getAttendanceByIdRepo(
      id
    );

  };

const getAttendanceByMRService =
  async (mrId) => {

    return repository.getAttendanceByMRRepo(
      mrId
    );

  };

module.exports = {
  checkInService,
  checkOutService,
  getAttendancesService,
  getAttendanceByIdService,
  getAttendanceByMRService,
};