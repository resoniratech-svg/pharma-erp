const express = require("express");

const router = express.Router();

const controller = require("./expense.controller");

router.post(
  "/",
  controller.createExpense
);

router.get(
  "/",
  controller.getAllExpenses
);

router.get(
  "/mr/:mrId",
  controller.getExpensesByMr
);

router.get(
  "/:id",
  controller.getExpenseById
);

router.put(
  "/:id",
  controller.updateExpense
);

router.patch(
  "/:id/approve",
  controller.approveExpense
);

router.patch(
  "/:id/reject",
  controller.rejectExpense
);

router.delete(
  "/:id",
  controller.deleteExpense
);

module.exports = router;