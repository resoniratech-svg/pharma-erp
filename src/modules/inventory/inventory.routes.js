const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../../middlewares/authMiddleware");

const checkFeature =
  require("../../middlewares/checkFeature");

const {
  createInventory,
  getInventories,
  getInventoryById,
  updateInventory,
  deleteInventory,
} = require("./inventory.controller");

router.post(
  "/",
  authMiddleware,
  checkFeature(
    "Inventory Management"
  ),
  createInventory
);

router.get(
  "/",
  authMiddleware,
  checkFeature(
    "Inventory Management"
  ),
  getInventories
);

router.get(
  "/:id",
  authMiddleware,
  checkFeature(
    "Inventory Management"
  ),
  getInventoryById
);

router.put(
  "/:id",
  authMiddleware,
  checkFeature(
    "Inventory Management"
  ),
  updateInventory
);

router.delete(
  "/:id",
  authMiddleware,
  checkFeature(
    "Inventory Management"
  ),
  deleteInventory
);

module.exports = router;