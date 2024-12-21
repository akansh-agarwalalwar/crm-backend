const express = require("express");
const router = express.Router();
const AuthEmployee = require("../../controller/AuthController");

router.post("/login", AuthEmployee.loginEmployee);

module.exports = router;