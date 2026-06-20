const express = require("express");
const router = express.Router();

const controller = require("./lowStockAlert.controller");

router.get(
  "/",
  controller.getLowStockProducts
);


module.exports = router;