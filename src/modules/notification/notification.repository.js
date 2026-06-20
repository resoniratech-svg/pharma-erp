const prisma = require("../../config/db");

const createNotificationRepo = async (data) => {
  return prisma.notification.create({
    data: {
      mrId: data.mrId,
      title: data.title,
      message: data.message,
      type: data.type,
    },
    include: {
      mr: true,
    },
  });
};

const getAllNotificationsRepo = async () => {
  return prisma.notification.findMany({
    include: {
      mr: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getNotificationByIdRepo = async (id) => {
  return prisma.notification.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      mr: true,
    },
  });
};

const getNotificationsByMrRepo = async (mrId) => {
  return prisma.notification.findMany({
    where: {
      mrId: Number(mrId),
    },
    include: {
      mr: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const markAsReadRepo = async (id) => {
  return prisma.notification.update({
    where: {
      id: Number(id),
    },
    data: {
      isRead: true,
    },
  });
};

const deleteNotificationRepo = async (id) => {
  return prisma.notification.delete({
    where: {
      id: Number(id),
    },
  });
};

module.exports = {
  createNotificationRepo,
  getAllNotificationsRepo,
  getNotificationByIdRepo,
  getNotificationsByMrRepo,
  markAsReadRepo,
  deleteNotificationRepo,
};