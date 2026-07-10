const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../../middlewares/authMiddleware"
);

const {
  register,
  login,
  logout,
  me,
} = require("./auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get(
  "/me",
  authMiddleware,
  me
);


module.exports = router;