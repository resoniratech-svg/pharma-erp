const repository =
  require("./doctor.repository");

const createDoctorService =
  async (data) => {
    return repository.createDoctorRepo(
      data
    );
  };

const getDoctorsService =
  async () => {
    return repository.getDoctorsRepo();
  };

const getDoctorByIdService =
  async (id) => {
    return repository.getDoctorByIdRepo(
      id
    );
  };

const updateDoctorService =
  async (id, data) => {
    return repository.updateDoctorRepo(
      id,
      data
    );
  };

const deleteDoctorService =
  async (id) => {
    return repository.deleteDoctorRepo(
      id
    );
  };

module.exports = {
  createDoctorService,
  getDoctorsService,
  getDoctorByIdService,
  updateDoctorService,
  deleteDoctorService,
};