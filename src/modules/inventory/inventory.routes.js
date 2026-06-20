const express = require("express");

const router = express.Router();

const controller =
  require("./inventory.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Inventory Route Working",
  });
});

router.post(
  "/",
  authMiddleware,
  controller.createInventory
);

router.get(
  "/",
  authMiddleware,
  controller.getInventories
);

router.get(
  "/company/:companyId",
  authMiddleware,
  controller.getInventoryByCompany
);

router.get(
  "/:id",
  authMiddleware,
  controller.getInventoryById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateInventory
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteInventory
);

module.exports = router;