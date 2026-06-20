const prisma =
  require("../../config/db");

const checkInRepo =
  async (data) => {

    return prisma.attendance.create({
      data,
      include: {
        mr: true,
      },
    });

  };

const checkOutRepo =
  async (id, data) => {

    return prisma.attendance.update({
      where: { id },
      data,
      include: {
        mr: true,
      },
    });

  };

const getAttendancesRepo =
  async () => {

    return prisma.attendance.findMany({
      include: {
        mr: true,
      },
      orderBy: {
        id: "desc",
      },
    });

  };

const getAttendanceByIdRepo =
  async (id) => {

    return prisma.attendance.findUnique({
      where: { id },
      include: {
        mr: true,
      },
    });

  };

const getAttendanceByMRRepo =
  async (mrId) => {

    return prisma.attendance.findMany({
      where: {
        mrId,
      },
      include: {
        mr: true,
      },
      orderBy: {
        id: "desc",
      },
    });

  };

module.exports = {
  checkInRepo,
  checkOutRepo,
  getAttendancesRepo,
  getAttendanceByIdRepo,
  getAttendanceByMRRepo,
};