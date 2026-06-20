const express = require("express");

const router = express.Router();

const controller = require(
  "./deliveryTracking.controller"
);

const authMiddleware = require(
  "../../middlewares/authMiddleware"
);

router.post(
  "/",
  authMiddleware,
  controller.createDeliveryTracking
);

router.get(
  "/",
  authMiddleware,
  controller.getAllDeliveryTracking
);

router.get(
  "/:id",
  authMiddleware,
  controller.getDeliveryTrackingById
);

module.exports = router;