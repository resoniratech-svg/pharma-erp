const prisma = require("../../config/db");

const createActivityRepo = async (data) => {
  return prisma.activity.create({
    data: {
      mrId: data.mrId,
      activityType: data.activityType,
      title: data.title,
      description: data.description,
      activityDate: new Date(data.activityDate),
    },
    include: {
      mr: true,
    },
  });
};

const getAllActivitiesRepo = async () => {
  return prisma.activity.findMany({
    include: {
      mr: true,
    },
    orderBy: {
      activityDate: "desc",
    },
  });
};

const getActivityByIdRepo = async (id) => {
  return prisma.activity.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      mr: true,
    },
  });
};

const updateActivityRepo = async (id, data) => {
  return prisma.activity.update({
    where: {
      id: Number(id),
    },
    data,
  });
};

const deleteActivityRepo = async (id) => {
  return prisma.activity.delete({
    where: {
      id: Number(id),
    },
  });
};

const getActivitiesByMrRepo = async (mrId) => {
  return prisma.activity.findMany({
    where: {
      mrId: Number(mrId),
    },
    include: {
      mr: true,
    },
    orderBy: {
      activityDate: "desc",
    },
  });
};

const getActivitiesByDateRepo = async (date) => {
  const start = new Date(date);
  const end = new Date(date);

  end.setDate(end.getDate() + 1);

  return prisma.activity.findMany({
    where: {
      activityDate: {
        gte: start,
        lt: end,
      },
    },
    include: {
      mr: true,
    },
  });
};

const completeActivityRepo = async (id) => {
  return prisma.activity.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "COMPLETED",
    },
  });
};

const cancelActivityRepo = async (id) => {
  return prisma.activity.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "CANCELLED",
    },
  });
};

module.exports = {
  createActivityRepo,
  getAllActivitiesRepo,
  getActivityByIdRepo,
  updateActivityRepo,
  deleteActivityRepo,
  getActivitiesByMrRepo,
  getActivitiesByDateRepo,
  completeActivityRepo,
  cancelActivityRepo,
};