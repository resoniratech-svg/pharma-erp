const express = require("express");

const router = express.Router();

const controller = require("./leave.controller");

router.post(
  "/",
  controller.createLeave
);

router.get(
  "/",
  controller.getAllLeaves
);

router.get(
  "/mr/:mrId",
  controller.getLeavesByMr
);

router.get(
  "/:id",
  controller.getLeaveById
);

router.put(
  "/:id",
  controller.updateLeave
);

router.patch(
  "/:id/approve",
  controller.approveLeave
);

router.patch(
  "/:id/reject",
  controller.rejectLeave
);

router.delete(
  "/:id",
  controller.deleteLeave
);

module.exports = router;