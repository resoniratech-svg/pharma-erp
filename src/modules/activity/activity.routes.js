const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

const controller = require("./activity.controller");

router.post(
  "/",
  authMiddleware,
  controller.createActivity
);

router.get(
  "/",
  authMiddleware,
  controller.getAllActivities
);

router.get(
  "/mr/:mrId",
  authMiddleware,
  controller.getActivitiesByMr
);

router.get(
  "/date/:date",
  authMiddleware,
  controller.getActivitiesByDate
);

router.get(
  "/:id",
  authMiddleware,
  controller.getActivityById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateActivity
);

router.patch(
  "/:id/complete",
  authMiddleware,
  controller.completeActivity
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  controller.cancelActivity
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteActivity
);

module.exports = router;