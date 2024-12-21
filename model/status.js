const mongoose = require("mongoose");

const EmployeeStatus = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ["active", "inactive"],
  },
  Employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
});

module.exports = mongoose.model("EmployeeStatus", EmployeeStatus);
