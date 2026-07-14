const express = require("express");
const controller = require("./scheme.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, controller.createScheme);
router.get("/", authMiddleware, controller.getSchemes);
router.get("/:id", authMiddleware, controller.getSchemeById);
router.put("/:id", authMiddleware, controller.updateScheme);
router.delete("/:id", authMiddleware, controller.deleteScheme);

module.exports = router;