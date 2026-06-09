const express = require("express");

const router = express.Router();

const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("./user.controller");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "SUPER_ADMIN"),
  getUsers
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "SUPER_ADMIN"),
  getUserById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "SUPER_ADMIN"),
  updateUser
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "SUPER_ADMIN"),
  deleteUser
);

module.exports = router;