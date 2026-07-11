const prisma = require("../../config/db");

const createChemistVisitRepo = async (data) => {
  const visit = await prisma.chemistVisit.create({
    data,
    include: {
      mr: true,
      chemist: true,
    },
  });

  // Automatically increment achieved target count
  try {
    const now = new Date(visit.visitDate || visit.createdAt || new Date());
    const month = now.getMonth() + 1; // 1-indexed
    const year = now.getFullYear();
    await prisma.target.updateMany({
      where: {
        mrId: Number(visit.mrId),
        month,
        year,
      },
      data: {
        achievedChemistVisits: { increment: 1 }
      }
    });
  } catch (err) {
    console.error("Failed to increment chemist target achievement:", err);
  }

  return visit;
};

const getAllChemistVisitsRepo = async () => {
  return prisma.chemistVisit.findMany({
    include: {
      mr: true,
      chemist: true,
    },
    orderBy: {
      visitDate: "desc",
    },
  });
};

const getChemistVisitByIdRepo = async (id) => {
  return prisma.chemistVisit.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      mr: true,
      chemist: true,
    },
  });
};

const updateChemistVisitRepo = async (id, data) => {
  return prisma.chemistVisit.update({
    where: {
      id: Number(id),
    },
    data,
    include: {
      mr: true,
      chemist: true,
    },
  });
};

const deleteChemistVisitRepo = async (id) => {
  return prisma.chemistVisit.delete({
    where: {
      id: Number(id),
    },
  });
};

const getChemistVisitsByMrRepo = async (mrId) => {
  return prisma.chemistVisit.findMany({
    where: {
      mrId: Number(mrId),
    },
    include: {
      mr: true,
      chemist: true,
    },
    orderBy: {
      visitDate: "desc",
    },
  });
};

const getChemistVisitsByChemistRepo = async (chemistId) => {
  return prisma.chemistVisit.findMany({
    where: {
      chemistId: Number(chemistId),
    },
    include: {
      mr: true,
      chemist: true,
    },
    orderBy: {
      visitDate: "desc",
    },
  });
};

module.exports = {
  createChemistVisitRepo,
  getAllChemistVisitsRepo,
  getChemistVisitByIdRepo,
  updateChemistVisitRepo,
  deleteChemistVisitRepo,
  getChemistVisitsByMrRepo,
  getChemistVisitsByChemistRepo,
};