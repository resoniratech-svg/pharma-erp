const prisma = require("../../config/db");

/* ==========================
   EXPENSE
========================== */

const createExpenseRepo = async (data) => {
  return prisma.expense.create({
    data,
  });
};

const getExpensesRepo = async () => {
  return prisma.expense.findMany({
    orderBy: {
      id: "desc",
    },
  });
};

const getExpenseByIdRepo = async (id) => {
  return prisma.expense.findUnique({
    where: { id },
  });
};

const updateExpenseRepo = async (id, data) => {
  return prisma.expense.update({
    where: { id },
    data,
  });
};

const deleteExpenseRepo = async (id) => {
  return prisma.expense.delete({
    where: { id },
  });
};

/* ==========================
   INCOME
========================== */

const createIncomeRepo = async (data) => {
  return prisma.income.create({
    data,
  });
};

const getIncomesRepo = async () => {
  return prisma.income.findMany({
    orderBy: {
      id: "desc",
    },
  });
};

const getIncomeByIdRepo = async (id) => {
  return prisma.income.findUnique({
    where: { id },
  });
};

const updateIncomeRepo = async (id, data) => {
  return prisma.income.update({
    where: { id },
    data,
  });
};

const deleteIncomeRepo = async (id) => {
  return prisma.income.delete({
    where: { id },
  });
};

/* ==========================
   PROFIT LOSS
========================== */

const getProfitLossRepo = async () => {
  const incomeResult =
    await prisma.income.aggregate({
      _sum: {
        amount: true,
      },
    });

  const expenseResult =
    await prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
    });

  const totalIncome =
    incomeResult._sum.amount || 0;

  const totalExpense =
    expenseResult._sum.amount || 0;

  return {
    totalIncome,
    totalExpense,
    profit:
      totalIncome - totalExpense,
  };
};

module.exports = {
  createExpenseRepo,
  getExpensesRepo,
  getExpenseByIdRepo,
  updateExpenseRepo,
  deleteExpenseRepo,

  createIncomeRepo,
  getIncomesRepo,
  getIncomeByIdRepo,
  updateIncomeRepo,
  deleteIncomeRepo,

  getProfitLossRepo,
};