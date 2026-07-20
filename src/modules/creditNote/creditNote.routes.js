const express = require("express");
const router = express.Router();
const controller = require("./creditNote.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

router.post("/", authMiddleware, controller.create);
router.get("/", authMiddleware, controller.getAll);
router.get("/:id", authMiddleware, controller.getById);
router.post("/:id/settle", authMiddleware, controller.settle);

module.exports = router;
