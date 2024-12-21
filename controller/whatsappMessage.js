const Chat = require("../model/ChatNumber");
const express = require("express");
const app = express();
const socketIo = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const axios = require("axios");
const con = require("../config/connection");
const FormData = require("form-data");
const fs = require("fs");
const multer = require("multer");

const token =
  "EAAcK5CAs3RABO6PFCORUSRbVKsmQ50mzUiM6TaZCAHVFvwifwOeCdbHS29uQWBMt010j1KZASuGyajAFLXfKdyORPiibnmrNpgjRbzUXxmALZCV6UFkhZBsi9P4Jahifa2GgCVc1d6il5IKhxHZCRUFVbEBH8LUAt9uKf8NfZAwRrVvYQtxggqS08uavguv3t0";

//socket start
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
//socket end

exports.getWebhook = function (req, res) {
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == "token"
  ) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(400);
  }
};

async function saveSenderNumber(phoneNumber, phoneNumberId, messageText) {
  const tableName = `chat_${phoneNumber}`;

  try {
    // Check if the table exists
    const [rows] = await con.query(`SHOW TABLES LIKE '${tableName}'`);

    // Create the table if it does not exist
    if (rows.length === 0) {
      await con.query(`
        CREATE TABLE ${tableName} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          empId VARCHAR(255),
          \`from\` TEXT,
          \`to\` VARCHAR(255),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log(`MySQL table ${tableName} created successfully.`);
    } else {
      console.log(`MySQL table ${tableName} already exists.`);
    }

    // Save messageText to the MySQL table
    if (messageText) {
      // Get the current time in IST
      const currentTime = new Date();
      const istTime = new Date(currentTime.getTime() + 60 * 1000); // Add 5.5 hours to UTC

      await con.query(
        `INSERT INTO ${tableName} (\`from\`, createdAt) VALUES (?, ?)`,
        [messageText, istTime]
      );
      console.log("Message saved to MySQL table with IST time.");
    }

    const chat = await Chat.findOneAndUpdate(
      { phoneNumber },
      { $set: { phoneNumberId, lastMessageAt: new Date() } },
      { upsert: true, new: true }
    );
    console.log("Chat record saved or updated in MongoDB:", chat);
  } catch (error) {
    console.error("Error in saveSenderNumber:", error.message);
  }
}

exports.createWebhook = function (req, res) {
  const messageBody = req.body;
  console.log(messageBody);
  const phoneNumberId =
    messageBody?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
  const senderNumber =
    messageBody?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
  const messageText =
    messageBody?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;
  const media =
    messageBody?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.media;

  if (senderNumber && messageText) {
    console.log(`Message received from: ${senderNumber}`);
    console.log(`Message Body: ${messageText}`);
    console.log(`Media: ${media}`);
    saveSenderNumber(senderNumber, phoneNumberId, messageText);
    io.emit("apiData", { senderNumber, messageText });
  }
  res.sendStatus(200);
};

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find(
      {},
      { phoneNumber: 1, phoneNumberId: 1, _id: 0 }
    );

    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.sendStatus(500);
  }
};

exports.sendMessage = async (req, res) => {
  const { to, message } = req.body;

  try {
    // Step 1: Send the message using the API
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/483911051474446/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Step 2: Save the message to the MySQL table dynamically
    const tableName = `chat_${to}`;

    // Get the current time in IST
    const currentTime = new Date();
    const istOffset = 60 * 1000; // IST offset in milliseconds
    const istTime = new Date(currentTime.getTime() + istOffset);

    // Insert the sent message into the table
    await con.query(
      `INSERT INTO ${tableName} (empId, \`to\`, createdAt) VALUES (?, ?, ?)`,
      ["server", message, istTime]
    );
    console.log("Message saved to MySQL table with IST time.");

    // Step 3: Respond to the client
    res.json({ success: true, response: response.data });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPhoneHistory = async (req, res) => {
  const { phoneNumber } = req.params;
  const tableName = `chat_${phoneNumber}`;

  try {
    // Fetch the phoneNumberId from MongoDB
    const chat = await Chat.findOne({ phoneNumber });

    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found in MongoDB" });
    }

    const phoneNumberId = chat.phoneNumberId;

    // Check if the table exists
    const [rows] = await con.query(`SHOW TABLES LIKE '${tableName}'`);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Table ${tableName} does not exist in MySQL.`,
      });
    }

    // Fetch chat history from the specific table
    const [messages] = await con.query(
      `SELECT empId, \`from\`, \`to\`, createdAt 
       FROM ${tableName} 
       ORDER BY createdAt ASC`
    );

    // Respond with the chat history
    res.json({
      success: true,
      phoneNumberId,
      chats: messages,
    });
  } catch (error) {
    console.error("Error fetching phone history:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching phone history" });
  }
};

exports.sendFile = async (req, res) => {
  const { to, phoneNumberId } = req.body;

  if (!req.files || !req.files.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  try {
    // Step 1: Get the uploaded file
    const uploadedFile = req.files.file[0]; // Assuming 'file' is an array
    const filePath = uploadedFile.path;

    // Step 2: Upload the file to the server
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const uploadResponse = await axios.post(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/media`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders(),
        },
      }
    );

    const mediaId = uploadResponse.data.id;

    // Step 3: Send the file as a message using the API
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/483911051474446/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "document",
        document: {
          id: mediaId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Step 4: Save the message details in MySQL
    const tableName = `chat_${to}`;
    const currentTime = new Date();
    const istOffset = 60 * 1000;
    const istTime = new Date(currentTime.getTime() + istOffset);

    const insertQuery = `
      INSERT INTO ${tableName} (empId, \`to\`, createdAt)
      VALUES (?, ?, ?)
    `;

    await con.query(insertQuery, [
      "server",
      `Sent a file: ${uploadedFile.originalname}`,
      istTime,
    ]);

    console.log("File message saved to MySQL table with IST time.");

    // Step 5: Respond to the client
    res.json({ success: true, response: response.data });
  } catch (error) {
    console.error("Error sending file:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // Clean up the uploaded file
    if (fs.existsSync(req.files.file[0].path)) {
      fs.unlinkSync(req.files.file[0].path);
    }
  }
};
