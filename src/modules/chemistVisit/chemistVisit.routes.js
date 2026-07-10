const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

const {
  createChemistVisit,
  getAllChemistVisits,
  getChemistVisitById,
  updateChemistVisit,
  deleteChemistVisit,
  getChemistVisitsByMr,
  getChemistVisitsByChemist,
} = require("./chemistVisit.controller");

router.post("/", authMiddleware, createChemistVisit);
router.get("/", authMiddleware, getAllChemistVisits);
router.get("/mr/:mrId", authMiddleware, getChemistVisitsByMr);
router.get(
  "/chemist/:chemistId",
  authMiddleware,
  getChemistVisitsByChemist
);
router.get("/:id", authMiddleware, getChemistVisitById);
router.put("/:id", authMiddleware, updateChemistVisit);
router.delete("/:id", authMiddleware, deleteChemistVisit);

module.exports = router;