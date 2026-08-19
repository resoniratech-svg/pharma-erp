const express = require("express");

const router = express.Router();

const {
  getAll,
  create,
  remove,
  getFeatures,
  updateSubscription,
} = require("./company.controller");

router.get("/", getAll);
router.post("/", create);
router.delete("/:id", remove);
router.get("/:id/features", getFeatures);
router.put("/:id/subscription", updateSubscription);

module.exports = router;