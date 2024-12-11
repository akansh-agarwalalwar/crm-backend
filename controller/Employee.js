const Employee = require("../model/Employee");

exports.createEmployee = async (req, res) => {
  try {
    // Destructure data from the request body
    const {
      name,
      email,
      empID,
      department,
      phone,
      address,
      hireDate,
      salary,
      position,
      startDate,
    } = req.body;

    // Check if files are uploaded
    if (req.files && req.files.idCard) {
      // If a file is uploaded, set the file path
      idCard = req.files.idCard[0].filename;
    }
    // Create a new employee instance
    const newEmployee = new Employee({
      name,
      email,
      empID,
      department,
      phone,
      address,
      hireDate,
      salary,
      position,
      startDate,
      idCard,
    });

    await newEmployee.save();

    // Return a success response
    res.status(201).json({
      message: "Employee created successfully",
      employee: newEmployee,
    });
  } catch (error) {
    // Catch and return any errors
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      empID,
      department,
      phone,
      address,
      hireDate,
      salary,
      position,
      startDate,
    } = req.body;

    // Check if files are uploaded
    if (req.files && req.files.idCard) {
      idCard = req.files.idCard[0].filename;
    }
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        empID,
        department,
        phone,
        address,
        hireDate,
        salary,
        position,
        startDate,
        idCard,
      },
      { new: true }
    );

    if (!updatedEmployee)
      return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee)
      return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};