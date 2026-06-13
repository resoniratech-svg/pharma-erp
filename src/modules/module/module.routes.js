const express = require("express");

const router = express.Router();

const {
  getAllModules,
} = require("./module.controller");

router.get("/", getAllModules);

module.exports = router;