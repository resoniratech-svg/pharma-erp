const express = require("express");
const router = express.Router();
const ctrl = require("./composition.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/", authMiddleware, ctrl.getAll);
router.get("/:id", authMiddleware, ctrl.getById);
router.post("/", authMiddleware, ctrl.create);
router.put("/:id", authMiddleware, ctrl.update);
router.delete("/:id", authMiddleware, ctrl.remove);

module.exports = router;
