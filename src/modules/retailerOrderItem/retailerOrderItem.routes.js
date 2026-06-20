const express = require("express");

const router = express.Router();

const controller =
  require("./retailerOrderItem.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createRetailerOrderItem
);

router.get(
  "/",
  authMiddleware,
  controller.getRetailerOrderItems
);

router.get(
  "/:id",
  authMiddleware,
  controller.getRetailerOrderItemById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateRetailerOrderItem
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteRetailerOrderItem
);

module.exports = router;