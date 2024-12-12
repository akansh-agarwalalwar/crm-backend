const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const WhatsappMessage = require("./routes/whatsappMessage");
const socketIo = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const User = require("./model/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Auth = require("./routes/AuthRoute");
const Admin = require("./routes/Admin/Employee");
require("dotenv").config();
const PORT = 4000;
const con = require("./config/connection");
const corsOptions = {
  origin: "*",
  methods: ["POST", "GET", "DELETE", "PUT", "PATCH"],
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.json());

const mongoUrl = process.env.mongo;

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.error(e));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const io = socketIo(server);

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("message", (data) => {
    console.log("Message received", data);
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

async function ensureTableExists() {
  try {
    const createWhatsAppChat = `
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empId VARCHAR(255) NOT NULL,
        leadMessage VARCHAR(15),
        empMessage VARCHAR(255),
        type ENUM("text","image","video","pdf","template") NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await con.execute(createWhatsAppChat);
  } catch (error) {
    console.error(error);
    console.log("Failed to ensure table exists");
  }
}

ensureTableExists();

app.use("/api/whatsapp", WhatsappMessage);

app.use("/api/auth", Auth);

app.use("/api/admin", Admin);

app.post("/webhook2", function (req, res) {
  const waId = req.body.entry[0].changes[0].value.contacts[0].wa_id;
  const contactName =
    req.body.entry[0].changes[0].value.contacts[0].profile.name;
  const messageBody = req.body.entry[0].changes[0].value.messages[0].text.body;
  const messageType = req.body.entry[0].changes[0].value.messages[0].type;
  const phoneNumberId =
    req.body.entry[0].changes[0].value.metadata.phone_number_id;

  console.log("===========================");
  console.log("Phone Number From:", waId);
  console.log("Contact Name:", contactName);
  console.log("Message Body:", messageBody);
  console.log("Message Type:", messageType);
  console.log("PhoneNumber Id:", phoneNumberId);
  io.emit("apiData", messageBody);
  // Define the payload
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: waId,
    type: "text",
    text: {
      preview_url: false,
      body: `Hello SlowCoder, Your message received`,
    },
  };

  // Define the headers
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  axios
    .post(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      payload,
      { headers }
    )
    .then((res) => {
      console.log("Message sent successfully:", res?.data);

      // Safely access the first contact in the contacts array
      const contact = res?.data?.contacts && res?.data?.contacts[0];

      if (contact) {
        console.log(`Message sent to: ${contact?.input}`);
        // Perform any other operations with contact here
      } else {
        console.error("No contacts returned in the res");
      }
    })
    .catch((error) => {
      console.error(
        "Error sending message:",
        error?.res ? error?.res.data : error.message
      );
    });
  res.sendStatus(200);
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const encryptedPassword = await bcrypt.hash(password, 10);
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.send({ error: "user exists" });
    }
    await User.create({
      username,
      email,
      password: encryptedPassword,
      role,
    });
    res.send({ status: "ok" });
  } catch (error) {
    res.send({ status: "error" });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  // console.log(email, password);

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", error: "Admin not found" });
    }

    // Check if the user has the admin role
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ status: "error", error: "Not authorized as admin" });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: "error", error: "Invalid password" });
    }

    // Generate a JWT token for the admin
    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token expiration time (optional)
    );

    // Respond with the token and admin details
    return res.status(200).json({
      status: "ok",
      data: {
        token,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    return res
      .status(500)
      .json({ status: "error", error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Hello, this is plain text response!");
});

app.listen(PORT, () => {
  console.log(`----Server Started at ${PORT}--------------`);
});
