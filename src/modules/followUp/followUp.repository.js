const prisma = require("../../config/db");

const createFollowUpRepo = async (data) => {
  return prisma.followUp.create({
    data: {
      mrId: data.mrId,
      doctorId: data.doctorId,
      chemistId: data.chemistId,
      meetingId: data.meetingId,
      title: data.title,
      remarks: data.remarks,
      followUpDate: new Date(data.followUpDate),
    },

    include: {
      mr: true,
      doctor: true,
      chemist: true,
      meeting: true,
    },
  });
};

const getAllFollowUpsRepo = async () => {
  return prisma.followUp.findMany({
    include: {
      mr: true,
      doctor: true,
      chemist: true,
      meeting: true,
    },
  });
};

const getFollowUpByIdRepo = async (id) => {
  return prisma.followUp.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      mr: true,
      doctor: true,
      chemist: true,
      meeting: true,
    },
  });
};

const updateFollowUpRepo = async (id, data) => {
  return prisma.followUp.update({
    where: {
      id: Number(id),
    },

    data,
  });
};

const deleteFollowUpRepo = async (id) => {
  return prisma.followUp.delete({
    where: {
      id: Number(id),
    },
  });
};

const getFollowUpsByMrRepo = async (mrId) => {
  return prisma.followUp.findMany({
    where: {
      mrId: Number(mrId),
    },

    include: {
      mr: true,
      doctor: true,
      chemist: true,
      meeting: true,
    },
  });
};

const getFollowUpsByDateRepo = async (date) => {
  const start = new Date(date);
  const end = new Date(date);

  end.setDate(end.getDate() + 1);

  return prisma.followUp.findMany({
    where: {
      followUpDate: {
        gte: start,
        lt: end,
      },
    },

    include: {
      mr: true,
      doctor: true,
      chemist: true,
      meeting: true,
    },
  });
};

const completeFollowUpRepo = async (id) => {
  return prisma.followUp.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "COMPLETED",
    },
  });
};

const cancelFollowUpRepo = async (id) => {
  return prisma.followUp.update({
    where: {
      id: Number(id),
    },

    data: {
      status: "CANCELLED",
    },
  });
};

module.exports = {
  createFollowUpRepo,
  getAllFollowUpsRepo,
  getFollowUpByIdRepo,
  updateFollowUpRepo,
  deleteFollowUpRepo,
  getFollowUpsByMrRepo,
  getFollowUpsByDateRepo,
  completeFollowUpRepo,
  cancelFollowUpRepo,
};