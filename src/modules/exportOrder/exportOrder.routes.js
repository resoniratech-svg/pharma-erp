const express = require("express");
const router = express.Router();
const controller = require("./exportOrder.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

router.post("/", authMiddleware, controller.createExportOrder);
router.get("/", authMiddleware, controller.getExportOrders);
router.get("/:id", authMiddleware, controller.getExportOrderById);
router.patch("/:id", authMiddleware, controller.updateExportOrder);
router.delete("/:id", authMiddleware, controller.deleteExportOrder);

module.exports = router;
