const service = require(
  "./accounting.service"
);

/* ==========================
   EXPENSE
========================== */

const createExpense =
  async (req, res) => {
    try {
      const result =
        await service.createExpenseService(
          req.body
        );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

const getExpenses =
  async (req, res) => {
    try {
      const result =
        await service.getExpensesService();

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

const getExpenseById =
  async (req, res) => {
    try {
      const result =
        await service.getExpenseByIdService(
          Number(req.params.id)
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

const updateExpense =
  async (req, res) => {
    try {
      const result =
        await service.updateExpenseService(
          Number(req.params.id),
          req.body
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

const deleteExpense =
  async (req, res) => {
    try {
      await service.deleteExpenseService(
        Number(req.params.id)
      );

      res.json({
        success: true,
        message:
          "Expense deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

/* ==========================
   INCOME
========================== */

const createIncome =
  async (req, res) => {
    try {
      const result =
        await service.createIncomeService(
          req.body
        );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

const getIncomes =
  async (req, res) => {
    try {
      const result =
        await service.getIncomesService();

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

const getIncomeById =
  async (req, res) => {
    try {
      const result =
        await service.getIncomeByIdService(
          Number(req.params.id)
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

const updateIncome =
  async (req, res) => {
    try {
      const result =
        await service.updateIncomeService(
          Number(req.params.id),
          req.body
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

const deleteIncome =
  async (req, res) => {
    try {
      await service.deleteIncomeService(
        Number(req.params.id)
      );

      res.json({
        success: true,
        message:
          "Income deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

/* ==========================
   PROFIT LOSS
========================== */

const getProfitLoss =
  async (req, res) => {
    try {
      const result =
        await service.getProfitLossService();

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,

  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,

  getProfitLoss,
};