const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  empID:{
    type: String,
    required: true,
    unique: true,
  },
  department: {
    type: String,
    // required: true,
  },
  phone: {
    type: String,
    // required: true,
  },
  address: {
    type: String,
    // required: true,
  },
  hireDate: {
    type: Date,
    // required: true,
  },
  terminationDate: {
    type: Date,
  },
  salary: {
    type: Number,
    // required: true,
  },
  startDate: {
    type: Date,
    // required: true,
  },
  position: {
    type: String,
    // required: true,
  },
  idCard: [
    {
      type: String,
    //   required: true,
    },
  ],
});

module.exports = mongoose.model("Employee", EmployeeSchema);