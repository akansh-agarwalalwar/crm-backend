const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../model/admin");
const Employee = require("../model/Employee");
const Status = require("../model/status")
const jwt = require("jsonwebtoken");
require("dotenv").config();
// Generate OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "akanshagarwal.alwar@gmail.com",
    pass: "knis dudg cotu rulj",
  },
});

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  // console.log(email);
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // console.log(user);
    const otp = generateOTP();
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password OTP",
      text: `Your password reset OTP is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Failed to send email" });
      }
      // console.log("Email sent:", info.response);
      res.status(200).json({ message: "OTP sent to your email" });
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email, resetOTP: otp });
    if (!user) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > user.resetOTPExpires) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    res.status(200).json({ message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

exports.EmployeeOTP = async (req, res) => {
  const { email } = req.body;
  // console.log(email);
  try {
    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // console.log(user);
    const otp = generateOTP();
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password OTP",
      text: `Your password reset OTP is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Failed to send email" });
      }
      // console.log("Email sent:", info.response);
      res.status(200).json({ message: "OTP sent to your email" });
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

exports.verifyEmployeeOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await Employee.findOne({ email, resetOTP: otp });
    if (!user) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > user.resetOTPExpires) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    res.status(200).json({ message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

exports.resetPasswordEmployee = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

exports.loginEmployee = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Employee.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", error: "Employee not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: "error", error: "Invalid password" });
    }

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const statusUpdate = await Status.findOneAndUpdate(
      { Employee: user._id },
      { status: "active" },
      { new: true, upsert: true }
    );

    if (!statusUpdate) {
      console.error("Failed to update employee status");
    }

    return res.status(200).json({
      status: "ok",
      data: {
        token,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Error during employee login:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal server error" });
  }
};
