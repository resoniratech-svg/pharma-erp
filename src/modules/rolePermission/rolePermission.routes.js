const express = require("express");

const router = express.Router();

const {
  assign
} = require("./rolePermission.controller");

router.post(
  "/assign",
  assign
);

module.exports = router;