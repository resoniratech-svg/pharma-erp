const express = require("express");

const router = express.Router();

const {
  createCategory,
  getAllCategories,
  getCategoryById,
} = require(
  "./productCategory.controller"
);

router.post(
  "/",
  createCategory
);

router.get("/", getAllCategories);

router.get(
  "/:id",
  getCategoryById
);

module.exports = router;