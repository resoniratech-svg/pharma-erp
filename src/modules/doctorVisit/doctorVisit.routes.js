const express =
  require("express");

const router =
  express.Router();

const controller =
  require("./doctorVisit.controller");

const authMiddleware =
  require("../../middlewares/authMiddleware");

router.post(
  "/",
  authMiddleware,
  controller.createDoctorVisit
);

router.get(
  "/",
  authMiddleware,
  controller.getDoctorVisits
);

router.get(
  "/:id",
  authMiddleware,
  controller.getDoctorVisitById
);

router.put(
  "/:id",
  authMiddleware,
  controller.updateDoctorVisit
);

router.delete(
  "/:id",
  authMiddleware,
  controller.deleteDoctorVisit
);

router.get(
  "/mr/:mrId",
  authMiddleware,
  controller.getDoctorVisitsByMR
);

router.get(
  "/doctor/:doctorId",
  authMiddleware,
  controller.getDoctorVisitsByDoctor
);

module.exports = router;