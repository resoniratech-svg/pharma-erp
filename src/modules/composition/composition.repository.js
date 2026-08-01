const prisma = require("../../config/db");

const getAllCompositionsRepo = () => {
  return prisma.composition.findMany({
    orderBy: { createdAt: "desc" },
  });
};

const getCompositionByIdRepo = (id) => {
  return prisma.composition.findUnique({ where: { id } });
};

const createCompositionRepo = (data) => {
  return prisma.composition.create({ data });
};

const updateCompositionRepo = (id, data) => {
  return prisma.composition.update({ where: { id }, data });
};

const deleteCompositionRepo = (id) => {
  return prisma.composition.delete({ where: { id } });
};

module.exports = {
  getAllCompositionsRepo,
  getCompositionByIdRepo,
  createCompositionRepo,
  updateCompositionRepo,
  deleteCompositionRepo,
};
