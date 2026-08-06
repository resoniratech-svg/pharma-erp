const express = require("express");

const router = express.Router();

const controller = require("./analytics.controller");

router.get(
  "/dashboard",
  controller.getDashboardAnalytics
);

router.get(
  "/mr/:mrId/dashboard",
  controller.getMrDashboardAnalytics
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

router.get(
  "/product-profitability",
  controller.getProductProfitability
);

module.exports = router;