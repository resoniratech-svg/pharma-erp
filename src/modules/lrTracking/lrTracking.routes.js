const express = require("express");

const router = express.Router();

const controller = require(
  "./lrTracking.controller"
);

const authMiddleware = require(
  "../../middlewares/authMiddleware"
);

router.post(
  "/",
  authMiddleware,
  controller.createLRTracking
);

router.get(
  "/",
  authMiddleware,
  controller.getAllLRTracking
);

router.get(
  "/:id",
  authMiddleware,
  controller.getLRTrackingById
);

router.patch(
  "/:id/status",
  authMiddleware,
  controller.updateLRStatus
);

module.exports = router;