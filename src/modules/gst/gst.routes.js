const express = require("express");
const gstController = require("./gst.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  gstController.createGST
);

router.get(
  "/",
  authMiddleware,
  gstController.getGSTs
);

router.get(
  "/:id",
  authMiddleware,
  gstController.getGSTById
);

router.put(
  "/:id",
  authMiddleware,
  gstController.updateGST
);

router.delete(
  "/:id",
  authMiddleware,
  gstController.deleteGST
);

module.exports = router;
