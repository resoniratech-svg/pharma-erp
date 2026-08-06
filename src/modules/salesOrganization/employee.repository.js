const prisma = require("../../config/db");

const createEmployeeRepo = async (data) => {
  return prisma.employee.create({
    data,
    include: {
      manager: true,
      subordinates: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });
};

const getEmployeesRepo = async (filters = {}) => {
  const where = {};

  if (filters.designation) {
    where.designation = filters.designation;
  }
  if (filters.reportsToId) {
    where.reportsToId = Number(filters.reportsToId);
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.zone) {
    where.zone = filters.zone;
  }
  if (filters.region) {
    where.region = filters.region;
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { employeeCode: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { headquarters: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.employee.findMany({
    where,
    include: {
      manager: true,
      subordinates: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });
};

const getEmployeeByIdRepo = async (id) => {
  return prisma.employee.findUnique({
    where: { id: Number(id) },
    include: {
      manager: true,
      subordinates: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
      nationalTargetsCreated: true,
      allocationsReceived: true,
      allocationsGiven: true,
    },
  });
};

const getEmployeeByCodeRepo = async (employeeCode) => {
  return prisma.employee.findUnique({
    where: { employeeCode },
    include: {
      manager: true,
      subordinates: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });
};

const getEmployeeByUserIdRepo = async (userId) => {
  return prisma.employee.findUnique({
    where: { userId: Number(userId) },
    include: {
      manager: true,
      subordinates: true,
    },
  });
};

const updateEmployeeRepo = async (id, data) => {
  return prisma.employee.update({
    where: { id: Number(id) },
    data,
    include: {
      manager: true,
      subordinates: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });
};

const deleteEmployeeRepo = async (id) => {
  return prisma.employee.delete({
    where: { id: Number(id) },
  });
};

module.exports = {
  createEmployeeRepo,
  getEmployeesRepo,
  getEmployeeByIdRepo,
  getEmployeeByCodeRepo,
  getEmployeeByUserIdRepo,
  updateEmployeeRepo,
  deleteEmployeeRepo,
};
