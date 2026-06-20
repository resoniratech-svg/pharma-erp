const repository = require(
  "./accounting.repository"
);

/* ==========================
   EXPENSE
========================== */

const createExpenseService =
  async (data) => {
    return repository.createExpenseRepo(
      data
    );
  };

const getExpensesService =
  async () => {
    return repository.getExpensesRepo();
  };

const getExpenseByIdService =
  async (id) => {
    return repository.getExpenseByIdRepo(
      id
    );
  };

const updateExpenseService =
  async (id, data) => {
    return repository.updateExpenseRepo(
      id,
      data
    );
  };

const deleteExpenseService =
  async (id) => {
    return repository.deleteExpenseRepo(
      id
    );
  };

/* ==========================
   INCOME
========================== */

const createIncomeService =
  async (data) => {
    return repository.createIncomeRepo(
      data
    );
  };

const getIncomesService =
  async () => {
    return repository.getIncomesRepo();
  };

const getIncomeByIdService =
  async (id) => {
    return repository.getIncomeByIdRepo(
      id
    );
  };

const updateIncomeService =
  async (id, data) => {
    return repository.updateIncomeRepo(
      id,
      data
    );
  };

const deleteIncomeService =
  async (id) => {
    return repository.deleteIncomeRepo(
      id
    );
  };

/* ==========================
   PROFIT LOSS
========================== */

const getProfitLossService =
  async () => {
    return repository.getProfitLossRepo();
  };

module.exports = {
  createExpenseService,
  getExpensesService,
  getExpenseByIdService,
  updateExpenseService,
  deleteExpenseService,

  createIncomeService,
  getIncomesService,
  getIncomeByIdService,
  updateIncomeService,
  deleteIncomeService,

  getProfitLossService,
};