const express = require("express");
const router = express.Router();

const controller = require("./distributor.controller");

router.get("/", controller.getDistributors);
router.post("/", controller.createDistributor);
router.put("/:id", controller.updateDistributor);

module.exports = router;
