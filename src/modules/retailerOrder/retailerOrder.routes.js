const express =
require("express");

const router =
express.Router();

const controller =
require("./retailerOrder.controller");

const authMiddleware =
require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createRetailerOrder
);

router.get(
  "/",
  authMiddleware,
  controller.getRetailerOrders
);

router.get(
  "/:id",
  authMiddleware,
  controller.getRetailerOrderById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateRetailerOrder
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteRetailerOrder
);

module.exports = router;