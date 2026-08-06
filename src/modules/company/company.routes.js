const express = require("express");

const router = express.Router();

const {
  getAll,
  create,
  remove,
  getFeatures,
} = require("./company.controller");

router.get("/", getAll);
router.post("/", create);
router.delete("/:id", remove);
router.get("/:id/features", getFeatures);

module.exports = router;