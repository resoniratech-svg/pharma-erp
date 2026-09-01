const prisma =
  require("../../config/db");

const checkInRepo =
  async (data) => {
    const active = await prisma.attendance.findFirst({
      where: {
        mrId: data.mrId,
        checkOutTime: null
      }
    });

    if (active) {
      const activeDate = active.checkInTime || active.attendanceDate || active.createdAt;
      if (new Date(activeDate).toDateString() !== new Date().toDateString()) {
        // Auto check-out stale session from a previous day
        await prisma.attendance.update({
          where: { id: active.id },
          data: {
            checkOutTime: activeDate,
            checkOutLatitude: active.checkInLatitude,
            checkOutLongitude: active.checkInLongitude,
          }
        });
      } else {
        throw new Error("You are already checked in! Please check out first.");
      }
    }

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

const getASMTeamAttendanceRepo = async (asmEmployeeId) => {
  return prisma.attendance.findMany({
    where: {
      mr: {
        user: {
          employee: {
            reportsToId: asmEmployeeId,
            designation: 'Medical Representative'
          }
        }
      }
    },
    include: {
      mr: {
        include: {
          user: {
            include: {
              employee: true
            }
          }
        }
      }
    },
    orderBy: {
      id: "desc"
    }
  });
};

module.exports = {
  checkInRepo,
  checkOutRepo,
  getAttendancesRepo,
  getAttendanceByIdRepo,
  getAttendanceByMRRepo,
  getASMTeamAttendanceRepo,
};