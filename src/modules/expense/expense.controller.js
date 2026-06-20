const service = require("./expense.service");

const createExpense = async (req, res) => {
  try {
    const data =
      await service.createExpenseService(req.body);

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllExpenses = async (req, res) => {
  const data =
    await service.getAllExpensesService();

  res.json({
    success: true,
    data,
  });
};

const getExpenseById = async (req, res) => {
  const data =
    await service.getExpenseByIdService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const updateExpense = async (req, res) => {
  const data =
    await service.updateExpenseService(
      req.params.id,
      req.body
    );

  res.json({
    success: true,
    data,
  });
};

const deleteExpense = async (req, res) => {
  await service.deleteExpenseService(
    req.params.id
  );

  res.json({
    success: true,
    message:
      "Expense Claim deleted successfully",
  });
};

const getExpensesByMr = async (req, res) => {
  const data =
    await service.getExpensesByMrService(
      req.params.mrId
    );

  res.json({
    success: true,
    data,
  });
};

const approveExpense = async (req, res) => {
  const data =
    await service.approveExpenseService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

const rejectExpense = async (req, res) => {
  const data =
    await service.rejectExpenseService(
      req.params.id
    );

  res.json({
    success: true,
    data,
  });
};

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpensesByMr,
  approveExpense,
  rejectExpense,
};