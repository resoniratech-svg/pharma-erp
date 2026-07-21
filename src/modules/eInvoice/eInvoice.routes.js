const express = require("express");
const router = express.Router();
const controller = require("./eInvoice.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/", authMiddleware, controller.getEInvoices);
router.get("/:id", authMiddleware, controller.getEInvoiceById);
router.post("/:id/generate-irn", authMiddleware, controller.generateIRN);
router.post("/:id/cancel-irn", authMiddleware, controller.cancelIRN);
router.post("/:id/retry", authMiddleware, controller.retryIRN);

module.exports = router;
