const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const router = express.Router();

const controller = require("./distributor.controller");

router.get("/", authMiddleware, controller.getDistributors);

module.exports = router;
