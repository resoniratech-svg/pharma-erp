const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const router = express.Router();

const controller = require("./tourPlan.controller");

router.post("/", authMiddleware, controller.createTourPlan);
router.get("/", authMiddleware, controller.getAllTourPlans);
router.get("/mr/:mrId", authMiddleware, controller.getTourPlansByMr);
router.get("/date/:date", authMiddleware, controller.getTourPlansByDate);
router.get("/asm/team", authMiddleware, controller.getASMTourPlans);
router.get("/mr/:mrId/today", authMiddleware, controller.getTodaySchedule);
router.get("/:id", authMiddleware, controller.getTourPlanById);
router.put("/:id", authMiddleware, controller.updateTourPlan);
router.delete("/:id", authMiddleware, controller.deleteTourPlan);
router.put("/:id/approve", authMiddleware, controller.approveTourPlan);
router.put("/:id/reject", authMiddleware, controller.rejectTourPlan);
router.put("/:id/complete", authMiddleware, controller.completeTourPlan);

module.exports = router;