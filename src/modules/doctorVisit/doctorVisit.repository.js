const prisma =
  require("../../config/db");

const createDoctorVisitRepo =
  async (data) => {
    return prisma.doctorVisit.create({
      data,
      include: {
        mr: true,
        doctor: true,
      },
    });
  };

const getDoctorVisitsRepo =
  async () => {
    return prisma.doctorVisit.findMany({
      include: {
        mr: true,
        doctor: true,
      },
      orderBy: {
        id: "desc",
      },
    });
  };

const getDoctorVisitByIdRepo =
  async (id) => {
    return prisma.doctorVisit.findUnique({
      where: { id },
      include: {
        mr: true,
        doctor: true,
      },
    });
  };

const updateDoctorVisitRepo =
  async (id, data) => {
    return prisma.doctorVisit.update({
      where: { id },
      data,
      include: {
        mr: true,
        doctor: true,
      },
    });
  };

const deleteDoctorVisitRepo =
  async (id) => {
    return prisma.doctorVisit.delete({
      where: { id },
    });
  };

const getDoctorVisitsByMRRepo =
  async (mrId) => {
    return prisma.doctorVisit.findMany({
      where: { mrId },
      include: {
        mr: true,
        doctor: true,
      },
      orderBy: {
        id: "desc",
      },
    });
  };

const getDoctorVisitsByDoctorRepo =
  async (doctorId) => {
    return prisma.doctorVisit.findMany({
      where: { doctorId },
      include: {
        mr: true,
        doctor: true,
      },
      orderBy: {
        id: "desc",
      },
    });
  };

module.exports = {
  createDoctorVisitRepo,
  getDoctorVisitsRepo,
  getDoctorVisitByIdRepo,
  updateDoctorVisitRepo,
  deleteDoctorVisitRepo,
  getDoctorVisitsByMRRepo,
  getDoctorVisitsByDoctorRepo,
};