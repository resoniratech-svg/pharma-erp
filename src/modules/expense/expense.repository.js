const prisma = require("../../config/db");

const createExpenseRepo = async (data) => {
  return prisma.expenseClaim.create({
    data: {
      mrId: data.mrId,
      expenseType: data.expenseType,
      amount: data.amount,
      expenseDate: new Date(data.expenseDate),
      description: data.description,
      receiptUrl: data.receiptUrl,
    },
    include: {
      mr: true,
    },
  });
};

const getAllExpensesRepo = async () => {
  return prisma.expenseClaim.findMany({
    include: {
      mr: true,
    },
    orderBy: {
      submittedAt: "desc",
    },
  });
};

const getExpenseByIdRepo = async (id) => {
  return prisma.expenseClaim.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      mr: true,
    },
  });
};

const updateExpenseRepo = async (id, data) => {
  return prisma.expenseClaim.update({
    where: {
      id: Number(id),
    },
    data,
  });
};

const deleteExpenseRepo = async (id) => {
  return prisma.expenseClaim.delete({
    where: {
      id: Number(id),
    },
  });
};

const getExpensesByMrRepo = async (mrId) => {
  return prisma.expenseClaim.findMany({
    where: {
      mrId: Number(mrId),
    },
    include: {
      mr: true,
    },
    orderBy: {
      submittedAt: "desc",
    },
  });
};

const approveExpenseRepo = async (id) => {
  return prisma.expenseClaim.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "APPROVED",
    },
  });
};

const rejectExpenseRepo = async (id) => {
  return prisma.expenseClaim.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "REJECTED",
    },
  });
};

module.exports = {
  createExpenseRepo,
  getAllExpensesRepo,
  getExpenseByIdRepo,
  updateExpenseRepo,
  deleteExpenseRepo,
  getExpensesByMrRepo,
  approveExpenseRepo,
  rejectExpenseRepo,
};