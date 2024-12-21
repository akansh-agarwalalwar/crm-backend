const express = require("express");
const router = express.Router();
const AuthController = require("../controller/AuthController");

router.post("/request-password-reset", AuthController.requestPasswordReset);

router.post("/verify-otp", AuthController.verifyOTP);

router.put("/reset-password", AuthController.resetPassword);

router.post("/emp-otp", AuthController.EmployeeOTP);

router.post("/verify-emp-otp", AuthController.verifyEmployeeOTP);

router.put("/reset-emp-password", AuthController.resetPasswordEmployee);

module.exports = router;