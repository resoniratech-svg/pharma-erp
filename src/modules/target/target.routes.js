const express = require("express");

const router = express.Router();

const controller = require("./target.controller");

router.post("/", controller.createTarget);

router.get("/", controller.getAllTargets);

router.get(
  "/mr/:mrId",
  controller.getTargetsByMr
);

router.get(
  "/month/:month/:year",
  controller.getTargetsByMonth
);

router.get("/:id", controller.getTargetById);

router.put("/:id", controller.updateTarget);

router.delete(
  "/:id",
  controller.deleteTarget
);

module.exports = router;