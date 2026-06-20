const express = require("express");

const router = express.Router();

const authMiddleware =
require("../../middlewares/authMiddleware");

const controller =
require("./warehouseTransfer.controller");

router.post(
  "/",
  authMiddleware,
  controller.createTransfer
);

router.get(
  "/",
  authMiddleware,
  controller.getTransfers
);

router.get(
  "/:id",
  authMiddleware,
  controller.getTransferById
);

module.exports = router;