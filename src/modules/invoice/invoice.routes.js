const express =
  require("express");

const router =
  express.Router();

const controller =
  require("./invoice.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createInvoice
);

router.get(
  "/",
  authMiddleware,
  controller.getInvoices
);

router.get(
  "/:id",
  authMiddleware,
  controller.getInvoiceById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateInvoice
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteInvoice
);

module.exports = router;