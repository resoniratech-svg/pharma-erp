const express = require("express");

const router = express.Router();

const controller = require("./followUp.controller");

router.post(
  "/",
  controller.createFollowUp
);

router.get(
  "/",
  controller.getAllFollowUps
);

router.get(
  "/mr/:mrId",
  controller.getFollowUpsByMr
);

router.get(
  "/date/:date",
  controller.getFollowUpsByDate
);

router.get(
  "/:id",
  controller.getFollowUpById
);

router.put(
  "/:id",
  controller.updateFollowUp
);

router.patch(
  "/:id/complete",
  controller.completeFollowUp
);

router.patch(
  "/:id/cancel",
  controller.cancelFollowUp
);

router.delete(
  "/:id",
  controller.deleteFollowUp
);

module.exports = router;