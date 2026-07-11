const prisma =
  require("../../config/db");

const createDoctorVisitRepo =
  async (data) => {
    const visit = await prisma.doctorVisit.create({
      data,
      include: {
        mr: true,
        doctor: true,
      },
    });

    // Automatically increment achieved target count
    try {
      const now = new Date(visit.visitDate || visit.createdAt || new Date());
      const month = now.getMonth() + 1; // 1-indexed
      const year = now.getFullYear();
      await prisma.target.updateMany({
        where: {
          mrId: Number(visit.mrId),
          month,
          year,
        },
        data: {
          achievedDoctorVisits: { increment: 1 }
        }
      });
    } catch (err) {
      console.error("Failed to increment doctor target achievement:", err);
    }

    return visit;
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