const express = require("express");

const router = express.Router();

const controller = require("./tourPlan.controller");

router.post("/", controller.createTourPlan);

router.get("/", controller.getAllTourPlans);

router.get("/mr/:mrId", controller.getTourPlansByMr);

router.get("/date/:date", controller.getTourPlansByDate);

router.get(
  "/mr/:mrId/today",
  controller.getTodaySchedule
);

router.get("/:id", controller.getTourPlanById);

router.put("/:id", controller.updateTourPlan);

router.delete("/:id", controller.deleteTourPlan);

router.put("/:id/approve", controller.approveTourPlan);

router.put("/:id/complete", controller.completeTourPlan);

module.exports = router;