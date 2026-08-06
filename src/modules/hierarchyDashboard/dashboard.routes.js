const express = require("express");
const router = express.Router();
const controller = require("./dashboard.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

// National Sales Dashboard KPIs
router.get("/nsm", authMiddleware, controller.getNSMDashboard);

// Regional Sales Dashboard KPIs
router.get("/rsm", authMiddleware, controller.getRSMDashboard);

// Area Sales Dashboard KPIs
router.get("/asm", authMiddleware, controller.getASMDashboard);

// Medical Representative Dashboard KPIs
router.get("/mr", authMiddleware, controller.getMRDashboard);

module.exports = router;
