const express = require("express");
const router = express.Router();
const controller = require("./targetAllocation.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

// --- Summaries ---
router.get("/summary", authMiddleware, controller.getNationalTargetSummary);
router.get("/rsm-summary", authMiddleware, controller.getRSMTargetSummary);
router.get("/asm-summary", authMiddleware, controller.getASMTargetSummary);

// --- National Targets ---
router.post("/national-targets", authMiddleware, controller.createNationalTarget);
router.get("/national-targets", authMiddleware, controller.getNationalTargets);
router.get("/national-targets/:id", authMiddleware, controller.getNationalTargetById);
router.put("/national-targets/:id", authMiddleware, controller.updateNationalTarget);

// --- Target Allocations ---
router.post("/allocate", authMiddleware, controller.allocateTarget);
router.post("/", authMiddleware, controller.allocateTarget);
router.get("/", authMiddleware, controller.getTargetAllocations);
router.get("/:id", authMiddleware, controller.getTargetAllocationById);
router.put("/:id", authMiddleware, controller.updateTargetAllocation);
router.delete("/:id", authMiddleware, controller.deleteTargetAllocation);

module.exports = router;
