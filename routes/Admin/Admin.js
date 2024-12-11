const express = require("express");
const app = express();
const router = express.Router();
const EmployeeManagement = require("./Employee");

app.use("/employees", EmployeeManagement);

module.exports = router;