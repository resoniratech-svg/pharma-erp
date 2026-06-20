const express = require("express");

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

router.post("/", createChemistVisit);

router.get("/", getAllChemistVisits);

router.get("/mr/:mrId", getChemistVisitsByMr);

router.get(
  "/chemist/:chemistId",
  getChemistVisitsByChemist
);

router.get("/:id", getChemistVisitById);

router.put("/:id", updateChemistVisit);

router.delete("/:id", deleteChemistVisit);

module.exports = router;