const Employee = require("../model/Employee");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const SALT_ROUNDS = 10;

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "akanshagarwal.alwar@gmail.com",
    pass: "knis dudg cotu rulj",
  },
});

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
      password,
    } = req.body;

    let idCard = null;

    // Check if files are uploaded
    if (req.files && req.files.idCard) {
      // If a file is uploaded, set the file path
      idCard = req.files.idCard[0].filename;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

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
      password: hashedPassword,
    });

    await newEmployee.save();
    const mailOptions = {
      from: "akanshagarwal.alwar@gmail.com",
      to: email,
      subject: "Welcome to the Team at TravelloTen!",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; border: 1px solid #ddd;">
          <div style="text-align: center; padding: 10px 0;">
            <img src="https://via.placeholder.com/150" alt="Company Logo" style="max-width: 150px; margin-bottom: 20px;">
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <h1 style="text-align: center; color: #2d89ef;">Welcome to [Company Name]!</h1>
            <p>Dear <strong>${name}</strong>,</p>
            <p>We are thrilled to welcome you to the team as a <strong>${position}</strong> in our <strong>${department}</strong> department. Your journey with us begins now, and we couldn't be happier to have you onboard!</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <h3 style="color: #2d89ef;">Your Employee Details:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Employee ID:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${empID}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Password:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${password}</td>
              </tr>
            </table>
    
            <p style="font-size: 14px; color: #555;">For your security, please change your password after your first login.</p>
    
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    
            <p>If you have any questions or need assistance, feel free to reach out to the HR team at <a href="mailto:hr@company.com" style="color: #2d89ef;">hr@company.com</a>.</p>
            <p>We are excited to see the great things you will achieve with us!</p>
    
            <p style="margin-top: 30px; text-align: center; font-size: 12px; color: #777;">
              © ${new Date().getFullYear()} [Company Name]. All rights reserved.<br>
              <a href="https://www.travello10.com" style="color: #2d89ef; text-decoration: none;">Visit our website</a> 
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Return a success response
    res.status(201).json({
      message: "Employee created and email sent successfully",
      employee: newEmployee,
    });
  } catch (error) {
    // Catch and return any errors
    console.error("Error creating employee or sending email:", error);
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
