const express = require("express");
const router = express.Router();
const controller = require("./employee.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

// Organization hierarchy tree
router.get("/tree", authMiddleware, controller.getSalesOrganizationTree);

// Logged-in manager's direct team
router.get("/my-team", authMiddleware, controller.getMyTeam);

// Employee CRUD
router.post("/employees", authMiddleware, controller.createEmployee);
router.get("/employees", authMiddleware, controller.getEmployees);
router.get("/employees/:id", authMiddleware, controller.getEmployeeById);
router.put("/employees/:id", authMiddleware, controller.updateEmployee);
router.delete("/employees/:id", authMiddleware, controller.deleteEmployee);

module.exports = router;
