const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const router = express.Router();

const controller = require("./hospital.controller");

router.get("/", authMiddleware, controller.getHospitals);

module.exports = router;
