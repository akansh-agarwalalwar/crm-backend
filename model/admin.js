const mongoose = require("mongoose");

const admin = new mongoose.Schema({
  username: {
    type: String,
    // required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "admin",
  },
  otp: { type: String },
  resetOTP: {
    type: String,
  },
  resetOTPExpires: {
    type: Date,
  },
});

const Admin = mongoose.model("Admin", admin);

module.exports = Admin;