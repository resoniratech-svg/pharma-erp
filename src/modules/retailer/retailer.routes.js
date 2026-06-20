const express =
  require("express");

const router =
  express.Router();

const controller =
  require("./retailer.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createRetailer
);

router.get(
  "/",
  authMiddleware,
  controller.getRetailers
);

router.get(
  "/stockist/:stockistId",
  authMiddleware,
  controller.getRetailersByStockist
);

router.get(
  "/:id",
  authMiddleware,
  controller.getRetailerById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateRetailer
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteRetailer
);

module.exports = router;