const express = require("express");
const router = express.Router();
const controller = require("./dashboard.controller");
// Assuming there is auth middleware, but sticking to standard structure:
// const authMiddleware = require("../../middlewares/authMiddleware");

router.get(
  "/super-admin",
  controller.getSuperAdminMetrics
);

module.exports = router;
