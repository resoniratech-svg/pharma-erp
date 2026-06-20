const prisma = require("../../config/db");

const createDailyReportRepo = async (data) => {
  return prisma.dailyReport.create({
    data: {
      mrId: data.mrId,
      reportDate: new Date(data.reportDate),
      doctorVisits: data.doctorVisits,
      chemistVisits: data.chemistVisits,
      samplesDistributed: data.samplesDistributed,
      ordersCollected: data.ordersCollected,
      remarks: data.remarks,
    },
    include: {
      mr: true,
    },
  });
};

const getAllDailyReportsRepo = async () => {
  return prisma.dailyReport.findMany({
    include: {
      mr: true,
    },
  });
};

const getDailyReportByIdRepo = async (id) => {
  return prisma.dailyReport.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      mr: true,
    },
  });
};

const updateDailyReportRepo = async (id, data) => {
  return prisma.dailyReport.update({
    where: {
      id: Number(id),
    },
    data,
  });
};

const deleteDailyReportRepo = async (id) => {
  return prisma.dailyReport.delete({
    where: {
      id: Number(id),
    },
  });
};

const getDailyReportsByMrRepo = async (mrId) => {
  return prisma.dailyReport.findMany({
    where: {
      mrId: Number(mrId),
    },
    include: {
      mr: true,
    },
  });
};

const getDailyReportsByDateRepo = async (date) => {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  return prisma.dailyReport.findMany({
    where: {
      reportDate: {
        gte: start,
        lt: end,
      },
    },
    include: {
      mr: true,
    },
  });
};

module.exports = {
  createDailyReportRepo,
  getAllDailyReportsRepo,
  getDailyReportByIdRepo,
  updateDailyReportRepo,
  deleteDailyReportRepo,
  getDailyReportsByMrRepo,
  getDailyReportsByDateRepo,
};