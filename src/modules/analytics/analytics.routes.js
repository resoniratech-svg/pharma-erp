const express = require("express");

const router = express.Router();

const controller = require("./analytics.controller");

router.get(
  "/dashboard",
  controller.getDashboardAnalytics
);

router.get(
  "/leads",
  controller.getLeadAnalytics
);

router.get(
  "/expenses",
  controller.getExpenseAnalytics
);

router.get(
  "/leaves",
  controller.getLeaveAnalytics
);

router.get(
  "/mr-performance",
  controller.getMrPerformance
);

module.exports = router;