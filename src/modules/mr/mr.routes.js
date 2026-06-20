const express =
  require("express");

const router =
  express.Router();

const controller =
  require("./mr.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createMR
);

router.get(
  "/",
  authMiddleware,
  controller.getMRs
);

router.get(
  "/:id",
  authMiddleware,
  controller.getMRById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateMR
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteMR
);

module.exports = router;