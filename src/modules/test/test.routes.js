const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../../middlewares/authMiddleware");

const checkFeature =
  require("../../middlewares/checkFeature");

router.get(
  "/product-master",
  authMiddleware,
  checkFeature(
    "Product Master Management"
  ),
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "You have access to Product Master Management",
    });
  }
);

module.exports = router;