const express = require("express");
const controller = require("./packing-type.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, controller.createPackingType);
router.get("/", authMiddleware, controller.getPackingTypes);
router.get("/:id", authMiddleware, controller.getPackingTypeById);
router.put("/:id", authMiddleware, controller.updatePackingType);
router.delete("/:id", authMiddleware, controller.deletePackingType);

module.exports = router;