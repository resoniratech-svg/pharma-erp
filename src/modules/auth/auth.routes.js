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
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("./auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get(
  "/me",
  authMiddleware,
  me
);
router.put(
  "/profile",
  authMiddleware,
  updateProfile
);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


module.exports = router;