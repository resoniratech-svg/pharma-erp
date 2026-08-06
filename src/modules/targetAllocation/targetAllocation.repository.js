const prisma = require("../../config/db");

// --- National Target Repository Functions ---

const createNationalTargetRepo = async (data) => {
  return prisma.nationalTarget.create({
    data,
    include: {
      creator: true,
      allocations: {
        include: {
          allocatedTo: true,
        },
      },
    },
  });
};

const getNationalTargetsRepo = async (filters = {}) => {
  const where = {};
  if (filters.financialYear) {
    where.financialYear = filters.financialYear;
  }
  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.nationalTarget.findMany({
    where,
    include: {
      creator: true,
      allocations: {
        include: {
          allocatedTo: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });
};

const getNationalTargetByIdRepo = async (id) => {
  return prisma.nationalTarget.findUnique({
    where: { id: Number(id) },
    include: {
      creator: true,
      allocations: {
        include: {
          allocatedTo: true,
        },
      },
    },
  });
};

const updateNationalTargetRepo = async (id, data) => {
  return prisma.nationalTarget.update({
    where: { id: Number(id) },
    data,
    include: {
      creator: true,
      allocations: {
        include: {
          allocatedTo: true,
        },
      },
    },
  });
};

// --- Target Allocation Repository Functions ---

const createTargetAllocationRepo = async (data) => {
  return prisma.targetAllocation.create({
    data,
    include: {
      allocatedTo: true,
      allocatedBy: true,
      nationalTarget: true,
    },
  });
};

const getTargetAllocationsRepo = async (filters = {}) => {
  const where = {};

  if (filters.financialYear) {
    where.financialYear = filters.financialYear;
  }
  if (filters.allocatedToEmployeeId) {
    where.allocatedToEmployeeId = Number(filters.allocatedToEmployeeId);
  }
  if (filters.allocatedByEmployeeId) {
    where.allocatedByEmployeeId = Number(filters.allocatedByEmployeeId);
  }
  if (filters.nationalTargetId) {
    where.nationalTargetId = Number(filters.nationalTargetId);
  }
  if (filters.sourceAllocationId) {
    where.sourceAllocationId = Number(filters.sourceAllocationId);
  }
  if (filters.status) {
    where.status = filters.status;
  }

  return prisma.targetAllocation.findMany({
    where,
    include: {
      allocatedTo: true,
      allocatedBy: true,
      nationalTarget: true,
    },
    orderBy: {
      id: "desc",
    },
  });
};

const getTargetAllocationByIdRepo = async (id) => {
  return prisma.targetAllocation.findUnique({
    where: { id: Number(id) },
    include: {
      allocatedTo: true,
      allocatedBy: true,
      nationalTarget: true,
      childAllocations: {
        include: {
          allocatedTo: true,
        },
      },
    },
  });
};

const updateTargetAllocationRepo = async (id, data) => {
  return prisma.targetAllocation.update({
    where: { id: Number(id) },
    data,
    include: {
      allocatedTo: true,
      allocatedBy: true,
      nationalTarget: true,
    },
  });
};

const deleteTargetAllocationRepo = async (id) => {
  return prisma.targetAllocation.delete({
    where: { id: Number(id) },
  });
};

module.exports = {
  createNationalTargetRepo,
  getNationalTargetsRepo,
  getNationalTargetByIdRepo,
  updateNationalTargetRepo,
  createTargetAllocationRepo,
  getTargetAllocationsRepo,
  getTargetAllocationByIdRepo,
  updateTargetAllocationRepo,
  deleteTargetAllocationRepo,
};
