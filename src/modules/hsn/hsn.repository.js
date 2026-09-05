const prisma = require('../../config/db');

const createHSN = async (data) => {
  return await prisma.hSNCode.create({ data });
};

const getHSNs = async () => {
  return await prisma.hSNCode.findMany({
    orderBy: { createdAt: "desc" },
  });
};

const getHSNById = async (id) => {
  return await prisma.hSNCode.findUnique({
    where: { id },
  });
};

const updateHSN = async (id, data) => {
  return await prisma.hSNCode.update({
    where: { id },
    data,
  });
};

const deleteHSN = async (id) => {
  return await prisma.hSNCode.delete({
    where: { id },
  });
};

module.exports = {
  createHSN,
  getHSNs,
  getHSNById,
  updateHSN,
  deleteHSN,
};
