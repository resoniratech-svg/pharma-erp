const express = require("express");

const router = express.Router();

const controller = require(
  "./routeHistory.controller"
);

router.get(
  "/mr/:mrId/date/:date",
  controller.getRouteHistory
);

module.exports = router;