const express = require("express");
const hsnController = require("./hsn.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  hsnController.createHSN
);

router.get(
  "/",
  authMiddleware,
  hsnController.getHSNs
);

router.get(
  "/:id",
  authMiddleware,
  hsnController.getHSNById
);

router.put(
  "/:id",
  authMiddleware,
  hsnController.updateHSN
);

router.delete(
  "/:id",
  authMiddleware,
  hsnController.deleteHSN
);

module.exports = router;
