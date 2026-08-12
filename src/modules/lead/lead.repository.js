const prisma = require("../../config/db");

const createLeadRepo = async (data) => {
  return prisma.lead.create({
    data,
    include: {
      assignedMr: true,
    },
  });
};

const getAllLeadsRepo = async () => {
  return prisma.lead.findMany({
    include: {
      assignedMr: true,
    },
  });
};

const getLeadByIdRepo = async (id) => {
  return prisma.lead.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      assignedMr: true,
    },
  });
};

const updateLeadRepo = async (id, data) => {
  return prisma.lead.update({
    where: {
      id: Number(id),
    },
    data,
  });
};

const deleteLeadRepo = async (id) => {
  return prisma.lead.delete({
    where: {
      id: Number(id),
    },
  });
};

const getLeadsByMrRepo = async (mrId) => {
  return prisma.lead.findMany({
    where: {
      assignedMrId: Number(mrId),
    },
    include: {
      assignedMr: true,
    },
  });
};

const assignLeadRepo = async (id, mrId) => {
  return prisma.lead.update({
    where: {
      id: Number(id),
    },
    data: {
      assignedMrId: Number(mrId),
      status: "ASSIGNED",
    },
  });
};

const convertLeadRepo = async (id, convertedTo, stockistId) => {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({
      where: { id: Number(id) }
    });

    if (!lead) throw new Error("Lead not found");

    if (convertedTo === 'Distributor') {
      await tx.distributor.create({
        data: {
          name: lead.name,
          mobile: lead.mobile || "",
          email: lead.email,
          code: lead.leadCode,
          state: lead.territory || "Unknown",
        }
      });
    } else if (convertedTo === 'Retailer') {
      await tx.retailer.create({
        data: {
          name: lead.name,
          mobile: lead.mobile || "",
          email: lead.email,
          code: lead.leadCode,
          address: lead.address,
          stockistId: stockistId ? Number(stockistId) : 1
        }
      });
    }

    return tx.lead.update({
      where: { id: Number(id) },
      data: { status: "CONVERTED" }
    });
  });
};

module.exports = {
  createLeadRepo,
  getAllLeadsRepo,
  getLeadByIdRepo,
  updateLeadRepo,
  deleteLeadRepo,
  getLeadsByMrRepo,
  assignLeadRepo,
  convertLeadRepo,
};