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

router.get("/debug-file", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  try {
    const file = fs.readFileSync(path.join(__dirname, '../../modules/batches/batch.repository.js'), 'utf8');
    res.send(file);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;