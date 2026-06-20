const express =
  require("express");

const router =
  express.Router();

const controller =
  require("./attendance.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.post(
  "/checkin",
  authMiddleware,
  controller.checkIn
);

router.put(
  "/checkout/:id",
  authMiddleware,
  controller.checkOut
);

router.get(
  "/",
  authMiddleware,
  controller.getAttendances
);

router.get(
  "/:id",
  authMiddleware,
  controller.getAttendanceById
);

router.get(
  "/mr/:mrId",
  authMiddleware,
  controller.getAttendanceByMR
);

module.exports = router;