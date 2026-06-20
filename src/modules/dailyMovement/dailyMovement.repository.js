const prisma = require("../../config/db");

const getDailyMovementRepo = async (
  mrId,
  date
) => {
  const startDate = new Date(`${date}T00:00:00`);
  const endDate = new Date(`${date}T23:59:59`);

  const attendance =
    await prisma.attendance.findFirst({
      where: {
        mrId: Number(mrId),
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

  const doctorVisits =
    await prisma.doctorVisit.count({
      where: {
        mrId: Number(mrId),
        visitDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

  const chemistVisits =
    await prisma.chemistVisit.count({
      where: {
        mrId: Number(mrId),
        visitDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

  let workingHours = 0;

  if (
    attendance?.checkInTime &&
    attendance?.checkOutTime
  ) {
    const diff =
      new Date(attendance.checkOutTime) -
      new Date(attendance.checkInTime);

    workingHours =
      diff / (1000 * 60 * 60);
  }

  return {
    mrId: Number(mrId),

    date,

    checkInTime:
      attendance?.checkInTime || null,

    checkOutTime:
      attendance?.checkOutTime || null,

    doctorVisits,

    chemistVisits,

    totalStops:
      doctorVisits + chemistVisits,

    workingHours:
      Number(
        workingHours.toFixed(2)
      ),
  };
};

module.exports = {
  getDailyMovementRepo,
};