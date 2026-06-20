const prisma = require("../../config/db");

const createTargetRepo = async (data) => {
  return prisma.target.create({
    data,
    include: {
      mr: true,
    },
  });
};

const getAllTargetsRepo = async () => {
  return prisma.target.findMany({
    include: {
      mr: true,
    },
  });
};

const getTargetByIdRepo = async (id) => {
  return prisma.target.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      mr: true,
    },
  });
};

const updateTargetRepo = async (id, data) => {
  return prisma.target.update({
    where: {
      id: Number(id),
    },
    data,
  });
};

const deleteTargetRepo = async (id) => {
  return prisma.target.delete({
    where: {
      id: Number(id),
    },
  });
};

const getTargetsByMrRepo = async (mrId) => {
  return prisma.target.findMany({
    where: {
      mrId: Number(mrId),
    },
    include: {
      mr: true,
    },
  });
};

const getTargetsByMonthRepo = async (
  month,
  year
) => {
  return prisma.target.findMany({
    where: {
      month: Number(month),
      year: Number(year),
    },
    include: {
      mr: true,
    },
  });
};

module.exports = {
  createTargetRepo,
  getAllTargetsRepo,
  getTargetByIdRepo,
  updateTargetRepo,
  deleteTargetRepo,
  getTargetsByMrRepo,
  getTargetsByMonthRepo,
};