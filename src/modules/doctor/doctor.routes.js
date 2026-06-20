const express =
  require("express");

const router =
  express.Router();

const controller =
  require("./doctor.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createDoctor
);

router.get(
  "/",
  authMiddleware,
  controller.getDoctors
);

router.get(
  "/:id",
  authMiddleware,
  controller.getDoctorById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateDoctor
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteDoctor
);

module.exports = router;