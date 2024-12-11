const express = require("express");
const upload = require("../../config/upload");
const router = express.Router();
const EmployeeController = require("../../controller/Employee");

router.post(
  "/employee",
  upload.fields([{ name: "idCard", maxCount: 1 }]),
  EmployeeController.createEmployee
);

// READ All Employees
router.get("/employees", EmployeeController.getEmployees);

// READ Single Employee by ID
router.get("/employee/:id", EmployeeController.getEmployeeById);

// UPDATE Employee
router.put(
  "/employee/:id",
  upload.fields([{ name: "idCard", maxCount: 1 }]),
  EmployeeController.updateEmployee
);

// DELETE Employee
router.delete("/employee/:id", EmployeeController.deleteEmployee);

module.exports = router;
