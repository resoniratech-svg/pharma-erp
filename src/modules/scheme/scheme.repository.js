const prisma = require('../../config/db');

const createScheme = async (data) => {
  return await prisma.schemeMaster.create({ data });
};

const getSchemes = async () => {
  return await prisma.schemeMaster.findMany({
    orderBy: { createdAt: "desc" },
  });
};

const getSchemeById = async (id) => {
  return await prisma.schemeMaster.findUnique({
    where: { id },
  });
};

const updateScheme = async (id, data) => {
  return await prisma.schemeMaster.update({
    where: { id },
    data,
  });
};

const deleteScheme = async (id) => {
  return await prisma.schemeMaster.delete({
    where: { id },
  });
};

module.exports = {
  createScheme,
  getSchemes,
  getSchemeById,
  updateScheme,
  deleteScheme,
};