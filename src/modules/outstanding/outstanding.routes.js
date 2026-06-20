const express =
  require("express");

const router =
  express.Router();

const controller =
  require("./outstanding.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.get(
  "/retailer/:retailerId",
  authMiddleware,
  controller.getOutstandingByRetailer
);

module.exports = router;