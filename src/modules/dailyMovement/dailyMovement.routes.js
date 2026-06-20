const express = require("express");

const router = express.Router();

const controller = require(
  "./dailyMovement.controller"
);

router.get(
  "/mr/:mrId/date/:date",
  controller.getDailyMovement
);

module.exports = router;