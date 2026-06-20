const express =
  require("express");

const router =
  express.Router();

const controller =
  require("./paymentCollection.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createPaymentCollection
);

router.get(
  "/",
  authMiddleware,
  controller.getPaymentCollections
);

router.get(
  "/:id",
  authMiddleware,
  controller.getPaymentCollectionById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updatePaymentCollection
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deletePaymentCollection
);

module.exports = router;