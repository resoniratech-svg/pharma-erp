const express =
  require("express");

const router =
  express.Router();

const controller =
  require("./ledger.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createLedger
);

router.get(
  "/",
  authMiddleware,
  controller.getLedgers
);

router.get(
  "/:id",
  authMiddleware,
  controller.getLedgerById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateLedger
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteLedger
);

module.exports = router;