const express = require("express");

const router = express.Router();

const controller =
  require("./deadStock.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.get(
  "/dead-stock",
  authMiddleware,
  controller.getDeadStock
);

module.exports = router;