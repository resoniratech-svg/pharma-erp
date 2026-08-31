const express = require("express");
const router = express.Router();
const controller = require("./location.controller");

router.get("/", controller.getLocations);
router.post("/", controller.createLocation);

module.exports = router;
