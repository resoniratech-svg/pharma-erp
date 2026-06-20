const express = require("express");

const router = express.Router();

const controller = require("./meeting.controller");

router.post("/", controller.createMeeting);

router.get("/", controller.getAllMeetings);

router.get(
  "/mr/:mrId",
  controller.getMeetingsByMr
);

router.get(
  "/date/:date",
  controller.getMeetingsByDate
);

router.get("/:id", controller.getMeetingById);

router.put("/:id", controller.updateMeeting);

router.patch(
  "/:id/complete",
  controller.completeMeeting
);

router.patch(
  "/:id/cancel",
  controller.cancelMeeting
);

router.delete("/:id", controller.deleteMeeting);

module.exports = router;