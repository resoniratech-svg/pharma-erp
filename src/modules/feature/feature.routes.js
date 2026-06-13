const express = require("express");

const router = express.Router();

const {
  getAllFeatures,
} = require("./feature.controller");

router.get("/", getAllFeatures);

module.exports = router;