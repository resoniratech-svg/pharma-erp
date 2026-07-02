const prisma = require("../../config/db");

const getTodayScheduleRepo = async (mrId) => {

  const today = new Date();

  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0, 0, 0
  );

  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23, 59, 59
  );

  const plan =
    await prisma.tourPlan.findFirst({
      where: {
        mrId: Number(mrId)
      },
      include: {
        tourPlanDoctors: true,
        tourPlanChemists: true
      }
    });

  if (!plan) {
    return null;
  }

  const plannedDoctors =
    plan.tourPlanDoctors.length;

  const plannedChemists =
    plan.tourPlanChemists.length;

  const completedDoctors =
    await prisma.doctorVisit.groupBy({
      by: ["doctorId"],
      where: {
        mrId: Number(mrId),
        visitDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

  const completedChemists =
    await prisma.chemistVisit.groupBy({
      by: ["chemistId"],
      where: {
        mrId: Number(mrId),
        visitDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

  const doctorCount =
    completedDoctors.length;

  const chemistCount =
    completedChemists.length;

  const totalPlanned =
  plannedDoctors + plannedChemists;

const totalCompleted =
  doctorCount + chemistCount;

const rawCompletion =
  totalPlanned > 0
    ? Math.round(
        (totalCompleted / totalPlanned) * 100
      )
    : 0;

const completion =
  Math.min(rawCompletion, 100);

  return {
    territory: plan.territory,
    objective: plan.objective,

    plannedDoctors,
    plannedChemists,

    completedDoctors: doctorCount,
    completedChemists: chemistCount,

    completion
  };
};

const createTourPlanRepo = async (data) => {
  const {
    mrId,
    tourDate,
    territory,
    objective,
    doctorIds = [],
    chemistIds = [],
  } = data;

  return prisma.tourPlan.create({
    data: {
      mrId,
      tourDate: new Date(tourDate),
      territory,
      objective,

      tourPlanDoctors: {
        create: doctorIds.map((doctorId) => ({
          doctor: {
            connect: {
              id: doctorId,
            },
          },
        })),
      },

      tourPlanChemists: {
        create: chemistIds.map((chemistId) => ({
          chemist: {
            connect: {
              id: chemistId,
            },
          },
        })),
      },
    },

    include: {
      mr: true,

      tourPlanDoctors: {
        include: {
          doctor: true,
        },
      },

      tourPlanChemists: {
        include: {
          chemist: true,
        },
      },
    },
  });
};

const getAllTourPlansRepo = async () => {
  return prisma.tourPlan.findMany({
    include: {
      mr: true,
  tourPlanDoctors: {
  include: {
    doctor: true,
  },
},

tourPlanChemists: {
  include: {
    chemist: true,
  },
},
    },
    orderBy: {
      tourDate: "desc",
    },
  });
};

const getTourPlanByIdRepo = async (id) => {
  return prisma.tourPlan.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      mr: true,
      tourPlanDoctors: {
        include: { doctor: true },
      },
      tourPlanChemists: {
        include: { chemist: true },
      },
    },
  });
};

const updateTourPlanRepo = async (id, data) => {
  return prisma.tourPlan.update({
    where: {
      id: Number(id),
    },
    data,
  });
};

const deleteTourPlanRepo = async (id) => {

  await prisma.tourPlanDoctor.deleteMany({
    where: {
      tourPlanId: Number(id),
    },
  });

  await prisma.tourPlanChemist.deleteMany({
    where: {
      tourPlanId: Number(id),
    },
  });

  return prisma.tourPlan.delete({
    where: {
      id: Number(id),
    },
  });
};

const getTourPlansByMrRepo = async (mrId) => {
  return prisma.tourPlan.findMany({
    where: {
      mrId: Number(mrId),
    },
    include: {
      tourPlanDoctors: {
        include: { doctor: true },
      },
      tourPlanChemists: {
        include: { chemist: true },
      },
    },
  });
};

const getTourPlansByDateRepo = async (date) => {
  return prisma.tourPlan.findMany({
    where: {
      tourDate: {
        gte: new Date(date),
        lt: new Date(
          new Date(date).getTime() + 24 * 60 * 60 * 1000
        ),
      },
    },
  });
};

const approveTourPlanRepo = async (id) => {
  return prisma.tourPlan.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "APPROVED",
    },
  });
};

const completeTourPlanRepo = async (id) => {
  return prisma.tourPlan.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "COMPLETED",
    },
  });
};

module.exports = {
  createTourPlanRepo,
  getAllTourPlansRepo,
  getTourPlanByIdRepo,
  updateTourPlanRepo,
  deleteTourPlanRepo,
  getTourPlansByMrRepo,
  getTourPlansByDateRepo,
  approveTourPlanRepo,
  completeTourPlanRepo,
  getTodayScheduleRepo,
};