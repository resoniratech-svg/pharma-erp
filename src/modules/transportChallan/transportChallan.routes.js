const express = require("express");

const router = express.Router();

const controller =
  require("./transportChallan.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createTransportChallan
);

router.get(
  "/",
  authMiddleware,
  controller.getTransportChallans
);

router.get(
  "/:id",
  authMiddleware,
  controller.getTransportChallanById
);

module.exports = router;