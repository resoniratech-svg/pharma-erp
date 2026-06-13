const express = require("express");

const router = express.Router();

const {
  assign,
  getCompanyPermissions,
} = require("./permission.controller");

router.post(
  "/assign",
  assign
);

router.get(
  "/company/:companyId",
  getCompanyPermissions
);

module.exports = router;