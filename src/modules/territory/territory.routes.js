const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const router = express.Router();

const controller = require("./territory.controller");

router.get("/beats", authMiddleware, controller.getTerritoryBeats);

module.exports = router;
