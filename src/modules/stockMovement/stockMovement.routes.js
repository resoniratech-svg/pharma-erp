const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../../middlewares/authMiddleware");

const checkFeature =
  require("../../middlewares/checkFeature");

const {
  createStockMovement,
  getStockMovements,
  getStockMovementById,
} = require(
  "./stockMovement.controller"
);

router.post(
  "/",
  authMiddleware,
  checkFeature("Inventory Management"),
  createStockMovement
);

router.get(
  "/",
  authMiddleware,
  checkFeature("Inventory Management"),
  getStockMovements
);

router.get(
  "/:id",
  authMiddleware,
  checkFeature("Inventory Management"),
  getStockMovementById
);

module.exports = router;