const prisma = require("../../config/db");

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
};