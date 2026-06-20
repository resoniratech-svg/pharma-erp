const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../../middlewares/authMiddleware");

const {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
} = require("./warehouse.controller");

router.post(
  "/",
  authMiddleware,
  createWarehouse
);

router.get(
  "/",
  authMiddleware,
  getWarehouses
);

router.get(
  "/:id",
  authMiddleware,
  getWarehouseById
);

router.put(
  "/:id",
  authMiddleware,
  updateWarehouse
);

router.delete(
  "/:id",
  authMiddleware,
  deleteWarehouse
);

module.exports = router;