const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../../middlewares/authMiddleware"
);

const {
  register,
  login,
  me,
} = require("./auth.controller");

router.post("/register", register);
router.post("/login", login);
router.get(
  "/me",
  authMiddleware,
  me
);


module.exports = router;