const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../../middlewares/authMiddleware");

const checkFeature =
  require("../../middlewares/checkFeature");

const {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
} = require("./batch.controller");

router.post(
  "/",
  authMiddleware,
  checkFeature("Batch Management"),
  createBatch
);

router.get(
  "/",
  authMiddleware,
  checkFeature("Batch Management"),
  getBatches
);

router.get(
  "/:id",
  authMiddleware,
  checkFeature("Batch Management"),
  getBatchById
);

router.put(
  "/:id",
  authMiddleware,
  checkFeature("Batch Management"),
  updateBatch
);

router.delete(
  "/:id",
  authMiddleware,
  checkFeature("Batch Management"),
  deleteBatch
);

module.exports = router;