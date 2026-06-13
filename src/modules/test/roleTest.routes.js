const express = require("express");

const router = express.Router();

const authMiddleware =
require("../../middlewares/authMiddleware");

const checkFeature =
require("../../middlewares/checkFeature");

const checkRoleFeature =
require("../../middlewares/checkRoleFeature");

router.get(
  "/inventory",

  authMiddleware,

  checkFeature(
    "Product Master Management"
  ),

  checkRoleFeature(
    "Product Master Management"
  ),

  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Role permission validated successfully",
    });
  }
);

module.exports = router;