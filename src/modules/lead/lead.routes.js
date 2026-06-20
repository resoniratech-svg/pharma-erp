const express = require("express");

const router = express.Router();

const controller = require("./lead.controller");

router.post("/", controller.createLead);

router.get("/", controller.getAllLeads);

router.get("/mr/:mrId", controller.getLeadsByMr);

router.get("/:id", controller.getLeadById);

router.put("/:id", controller.updateLead);

router.patch("/:id/assign", controller.assignLead);

router.patch("/:id/convert", controller.convertLead);

router.delete("/:id", controller.deleteLead);

module.exports = router;