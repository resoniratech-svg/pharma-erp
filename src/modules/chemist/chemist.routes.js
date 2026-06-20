const express =
  require("express");

const router =
  express.Router();

const controller =
  require("./chemist.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createChemist
);

router.get(
  "/",
  authMiddleware,
  controller.getChemists
);

router.get(
  "/:id",
  authMiddleware,
  controller.getChemistById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateChemist
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteChemist
);

module.exports = router;