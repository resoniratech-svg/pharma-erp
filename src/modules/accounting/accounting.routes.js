const express = require("express");

const controller = require(
  "./accounting.controller"
);

const router = express.Router();

/* EXPENSE */

router.post(
  "/expense",
  controller.createExpense
);

router.get(
  "/expense",
  controller.getExpenses
);

router.get(
  "/expense/:id",
  controller.getExpenseById
);

router.put(
  "/expense/:id",
  controller.updateExpense
);

router.delete(
  "/expense/:id",
  controller.deleteExpense
);

/* INCOME */

router.post(
  "/income",
  controller.createIncome
);

router.get(
  "/income",
  controller.getIncomes
);

router.get(
  "/income/:id",
  controller.getIncomeById
);

router.put(
  "/income/:id",
  controller.updateIncome
);

router.delete(
  "/income/:id",
  controller.deleteIncome
);

/* PROFIT LOSS */

router.get(
  "/profit-loss",
  controller.getProfitLoss
);

module.exports = router;