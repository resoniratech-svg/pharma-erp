const express = require("express");

const router = express.Router();

const controller = require("./notification.controller");

router.post(
  "/",
  controller.createNotification
);

router.get(
  "/",
  controller.getAllNotifications
);

router.get(
  "/mr/:mrId",
  controller.getNotificationsByMr
);

router.get(
  "/:id",
  controller.getNotificationById
);

router.patch(
  "/:id/read",
  controller.markAsRead
);

router.delete(
  "/:id",
  controller.deleteNotification
);

module.exports = router;