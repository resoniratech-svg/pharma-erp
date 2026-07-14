const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createGST = async (data) => {
  return await prisma.gSTRecord.create({ data });
};

const getGSTs = async () => {
  return await prisma.gSTRecord.findMany({
    orderBy: { createdAt: "desc" },
  });
};

const getGSTById = async (id) => {
  return await prisma.gSTRecord.findUnique({
    where: { id },
  });
};

const updateGST = async (id, data) => {
  return await prisma.gSTRecord.update({
    where: { id },
    data,
  });
};

const deleteGST = async (id) => {
  return await prisma.gSTRecord.delete({
    where: { id },
  });
};

module.exports = {
  createGST,
  getGSTs,
  getGSTById,
  updateGST,
  deleteGST,
};
