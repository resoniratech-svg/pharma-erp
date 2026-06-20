const express = require("express");

const router = express.Router();

const controller = require(
  "./stockist.controller"
);

const authMiddleware = require(
  "../../middlewares/authMiddleware"
);

router.post(
  "/",
  authMiddleware,
  controller.createStockist
);

router.get(
  "/",
  authMiddleware,
  controller.getAllStockists
);

router.get(
  "/:id",
  authMiddleware,
  controller.getStockistById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateStockist
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteStockist
);

module.exports = router;