const express = require("express");
const controller = require("./pricing.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, controller.createPricing);
router.get("/", authMiddleware, controller.getPricings);
router.get("/:id", authMiddleware, controller.getPricingById);
router.put("/:id", authMiddleware, controller.updatePricing);
router.delete("/:id", authMiddleware, controller.deletePricing);

module.exports = router;