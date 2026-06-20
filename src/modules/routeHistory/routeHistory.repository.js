const prisma = require("../../config/db");

const getRouteHistoryRepo = async (
  mrId,
  date
) => {
  const startDate = new Date(date);
  const endDate = new Date(date);

  endDate.setDate(endDate.getDate() + 1);

  const attendance =
    await prisma.attendance.findMany({
      where: {
        mrId: Number(mrId),
        attendanceDate: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

  const doctorVisits =
    await prisma.doctorVisit.findMany({
      where: {
        mrId: Number(mrId),
        visitDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        doctor: true,
      },
    });

  const chemistVisits =
    await prisma.chemistVisit.findMany({
      where: {
        mrId: Number(mrId),
        visitDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        chemist: true,
      },
    });

  let routePoints = [];

  attendance.forEach((a) => {
    if (
      a.checkInLatitude &&
      a.checkInLongitude
    ) {
      routePoints.push({
        type: "CHECK_IN",
        location: "Attendance Check-In",
        latitude: a.checkInLatitude,
        longitude: a.checkInLongitude,
        time: a.checkInTime,
      });
    }

    if (
      a.checkOutLatitude &&
      a.checkOutLongitude
    ) {
      routePoints.push({
        type: "CHECK_OUT",
        location: "Attendance Check-Out",
        latitude: a.checkOutLatitude,
        longitude: a.checkOutLongitude,
        time: a.checkOutTime,
      });
    }
  });

  doctorVisits.forEach((v) => {
    routePoints.push({
      type: "DOCTOR_VISIT",
      location: v.doctor.name,
      latitude: v.latitude,
      longitude: v.longitude,
      time: v.visitDate,
    });
  });

  chemistVisits.forEach((v) => {
    routePoints.push({
      type: "CHEMIST_VISIT",
      location: v.chemist.name,
      latitude: v.latitude,
      longitude: v.longitude,
      time: v.visitDate,
    });
  });

  routePoints.sort(
    (a, b) =>
      new Date(a.time) - new Date(b.time)
  );

  return routePoints;
};

module.exports = {
  getRouteHistoryRepo,
};