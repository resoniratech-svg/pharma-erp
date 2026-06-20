const express = require("express");

const router =
express.Router();

const controller =
require("./dispatch.controller");

const authMiddleware =
require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createDispatch
);

router.get(
  "/",
  authMiddleware,
  controller.getDispatches
);

router.get(
  "/:id",
  authMiddleware,
  controller.getDispatchById
);

module.exports = router;