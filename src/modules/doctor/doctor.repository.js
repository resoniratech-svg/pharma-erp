const prisma =
  require("../../config/db");

const createDoctorRepo =
  async (data) => {
    return prisma.doctor.create({
      data,
    });
  };

const getDoctorsRepo =
  async () => {
    return prisma.doctor.findMany({
      orderBy: {
        id: "desc",
      },
    });
  };

const getDoctorByIdRepo =
  async (id) => {
    return prisma.doctor.findUnique({
      where: { id },
    });
  };

const updateDoctorRepo =
  async (id, data) => {
    return prisma.doctor.update({
      where: { id },
      data,
    });
  };

const deleteDoctorRepo =
  async (id) => {
    return prisma.doctor.delete({
      where: { id },
    });
  };

module.exports = {
  createDoctorRepo,
  getDoctorsRepo,
  getDoctorByIdRepo,
  updateDoctorRepo,
  deleteDoctorRepo,
};