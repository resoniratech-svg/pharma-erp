const express = require("express");

const router = express.Router();

const controller = require("./expiryMonitoring.controller");

router.get("/", controller.getExpiringBatches);

module.exports = router;