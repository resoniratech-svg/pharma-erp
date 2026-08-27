const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const router = express.Router();

const controller = require("./dailyReport.controller");

router.post("/", authMiddleware, controller.createDailyReport);
router.get("/", authMiddleware, controller.getAllDailyReports);
router.get("/:id", authMiddleware, controller.getDailyReportById);
router.put("/:id", authMiddleware, controller.updateDailyReport);
router.delete("/:id", authMiddleware, controller.deleteDailyReport);
router.get("/mr/:mrId", authMiddleware, controller.getDailyReportsByMr);
router.get("/date/:date", authMiddleware, controller.getDailyReportsByDate);
router.get("/asm/team", authMiddleware, controller.getASMDailyReports);
router.get("/rsm/team", authMiddleware, controller.getRSMDailyReports);

module.exports = router;