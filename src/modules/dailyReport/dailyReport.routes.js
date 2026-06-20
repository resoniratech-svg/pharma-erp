const express = require("express");
const router = express.Router();

const controller = require("./dailyReport.controller");

router.post("/", controller.createDailyReport);

router.get("/", controller.getAllDailyReports);

router.get("/:id", controller.getDailyReportById);

router.put("/:id", controller.updateDailyReport);

router.delete("/:id", controller.deleteDailyReport);

router.get("/mr/:mrId", controller.getDailyReportsByMr);

router.get("/date/:date", controller.getDailyReportsByDate);

module.exports = router;