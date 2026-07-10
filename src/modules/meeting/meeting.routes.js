const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const router = express.Router();

const controller = require("./meeting.controller");

router.post("/", authMiddleware, controller.createMeeting);
router.get("/", authMiddleware, controller.getAllMeetings);
router.get(
  "/mr/:mrId",
  authMiddleware,
  controller.getMeetingsByMr
);
router.get(
  "/date/:date",
  authMiddleware,
  controller.getMeetingsByDate
);
router.get("/:id", authMiddleware, controller.getMeetingById);
router.put("/:id", authMiddleware, controller.updateMeeting);
router.patch(
  "/:id/complete",
  authMiddleware,
  controller.completeMeeting
);
router.patch(
  "/:id/cancel",
  authMiddleware,
  controller.cancelMeeting
);
router.delete("/:id", authMiddleware, controller.deleteMeeting);

module.exports = router;