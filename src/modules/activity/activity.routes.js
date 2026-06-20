const express = require("express");

const router = express.Router();

const controller = require("./activity.controller");

router.post(
  "/",
  controller.createActivity
);

router.get(
  "/",
  controller.getAllActivities
);

router.get(
  "/mr/:mrId",
  controller.getActivitiesByMr
);

router.get(
  "/date/:date",
  controller.getActivitiesByDate
);

router.get(
  "/:id",
  controller.getActivityById
);

router.put(
  "/:id",
  controller.updateActivity
);

router.patch(
  "/:id/complete",
  controller.completeActivity
);

router.patch(
  "/:id/cancel",
  controller.cancelActivity
);

router.delete(
  "/:id",
  controller.deleteActivity
);

module.exports = router;