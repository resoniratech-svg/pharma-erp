const prisma = require("../../config/db");

const createLeaveRepo = async (data) => {
  return prisma.leaveRequest.create({
    data: {
      mrId: data.mrId,
      leaveType: data.leaveType,
      fromDate: new Date(data.fromDate),
      toDate: new Date(data.toDate),
      reason: data.reason,
    },
    include: {
      mr: true,
    },
  });
};

const getAllLeavesRepo = async () => {
  return prisma.leaveRequest.findMany({
    include: {
      mr: true,
    },
    orderBy: {
      appliedAt: "desc",
    },
  });
};

const getLeaveByIdRepo = async (id) => {
  return prisma.leaveRequest.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      mr: true,
    },
  });
};

const updateLeaveRepo = async (id, data) => {
  return prisma.leaveRequest.update({
    where: {
      id: Number(id),
    },
    data,
  });
};

const deleteLeaveRepo = async (id) => {
  return prisma.leaveRequest.delete({
    where: {
      id: Number(id),
    },
  });
};

const getLeavesByMrRepo = async (mrId) => {
  return prisma.leaveRequest.findMany({
    where: {
      mrId: Number(mrId),
    },
    include: {
      mr: true,
    },
    orderBy: {
      appliedAt: "desc",
    },
  });
};

const approveLeaveRepo = async (id) => {
  return prisma.leaveRequest.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "APPROVED",
    },
  });
};

const rejectLeaveRepo = async (id) => {
  return prisma.leaveRequest.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "REJECTED",
    },
  });
};

module.exports = {
  createLeaveRepo,
  getAllLeavesRepo,
  getLeaveByIdRepo,
  updateLeaveRepo,
  deleteLeaveRepo,
  getLeavesByMrRepo,
  approveLeaveRepo,
  rejectLeaveRepo,
};