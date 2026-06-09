const prisma = require("../../config/db");

const findAllUsers = async () => {
  return prisma.user.findMany();
};

const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: {
      id: Number(id),
    },
  });
};

const updateUserById = async (id, data) => {
  return prisma.user.update({
    where: {
      id: Number(id),
    },
    data,
  });
};

const softDeleteUser = async (id) => {
  return prisma.user.update({
    where: {
      id: Number(id),
    },
    data: {
      isActive: false,
    },
  });
};

module.exports = {
  findAllUsers,
  findUserById,
  updateUserById,
  softDeleteUser,
};