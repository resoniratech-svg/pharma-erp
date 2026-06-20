const repo = require("./expense.repository");

module.exports = {
  createExpenseService: repo.createExpenseRepo,

  getAllExpensesService: repo.getAllExpensesRepo,

  getExpenseByIdService: repo.getExpenseByIdRepo,

  updateExpenseService: repo.updateExpenseRepo,

  deleteExpenseService: repo.deleteExpenseRepo,

  getExpensesByMrService: repo.getExpensesByMrRepo,

  approveExpenseService: repo.approveExpenseRepo,

  rejectExpenseService: repo.rejectExpenseRepo,
};