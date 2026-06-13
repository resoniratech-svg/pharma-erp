const express = require("express");

const router = express.Router();

const {
  create,
  getFeatures,
} = require("./company.controller");

router.post("/", create);

router.get(
  "/:id/features",
  getFeatures
);

module.exports = router;