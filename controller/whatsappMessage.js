const Chat = require("../model/ChatNumber");
const express = require("express");
const app = express();
const socketIo = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const axios = require("axios");

const token =
  "EAAcK5CAs3RABO6PFCORUSRbVKsmQ50mzUiM6TaZCAHVFvwifwOeCdbHS29uQWBMt010j1KZASuGyajAFLXfKdyORPiibnmrNpgjRbzUXxmALZCV6UFkhZBsi9P4Jahifa2GgCVc1d6il5IKhxHZCRUFVbEBH8LUAt9uKf8NfZAwRrVvYQtxggqS08uavguv3t0";
const token2 =
  "EAAcK5CAs3RABOygRZAn5613cgaBOdJWO8CnMXo3KHf3AGHfa8BrRZAr9FUqng72ZBaMgZCDTxy0YB2s2RXPxVfcQEqbURx6wqqXPlm3ruLAD4g2Vv6Vf8QjMooANpLVfnC1kx1hGtyogDqxqpz1gwqooTJpcqNL3TQ0mBkOWFJhELYuxGMhQbJmm8uAEu2BNhPd8Wjf7kcxAQX5drhDEwG74YIIZD";

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

// Save the sender number and phone number ID to the database
async function saveSenderNumber(phoneNumber, phoneNumberId) {
  try {
    // Check if the phone number already exists in the database
    const chat = await Chat.findOneAndUpdate(
      { phoneNumber }, // Search by phone number
      { $set: { phoneNumberId, lastMessageAt: new Date() } }, // Update the phone number ID and last message date
      { upsert: true, new: true } // Create new record if it doesn't exist
    );
    console.log("Chat record saved or updated:", chat);
  } catch (error) {
    console.error("Error saving sender number:", error.message);
  }
}

exports.createWebhook = function (req, res) {
  const messageBody = req.body;
  console.log(messageBody)
  const phoneNumberId =
    messageBody?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
  const senderNumber =
    messageBody?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
  const messageText =
    messageBody?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

  if (senderNumber && messageText) {
    console.log(`Message received from: ${senderNumber}`);
    console.log(`Message Body: ${messageText}`);

    saveSenderNumber(senderNumber, phoneNumberId);

    io.emit("apiData", { senderNumber, messageText });
  }
  res.sendStatus(200);
};

exports.getChats = async (req, res) => {
  try {
    // Fetch phoneNumber and phoneNumberId fields from the database
    const chats = await Chat.find(
      {},
      { phoneNumber: 1, phoneNumberId: 1, _id: 0 }
    );

    // Return the chats in the response
    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.sendStatus(500);
  }
};

exports.sendMessage = async (req, res) => {
  const { to, message, phoneNumberId } = req.body;
  try {
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

    res.json({ success: true, response: response.data });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPhoneHistory = async (req, res) => {
  const { phoneNumber } = req.params;

  try {
    // Fetch the Chat record associated with the phoneNumber
    const chat = await Chat.findOne({ phoneNumber });

    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    const messageHistory = {
      919462146421: [
        {
          id: 1,
          from: "1234567890",
          text: "Hi!",
          timestamp: "2024-12-01 10:00:00",
        },
        {
          id: 2,
          from: "me",
          text: "Hello!",
          timestamp: "2024-12-01 10:01:00",
        },
      ],
      917850930648: [
        {
          id: 1,
          from: "9876543210",
          text: "How are you?",
          timestamp: "2024-12-02 12:30:00",
        },
        {
          id: 2,
          from: "me",
          text: "I'm good, thanks!",
          timestamp: "2024-12-02 12:31:00",
        },
      ],
    };

    // Get the chat history for the phoneNumber
    const chats = messageHistory[phoneNumber] || [];

    // Return the phoneNumberId and chat history
    res.json({ success: true, phoneNumberId: chat.phoneNumberId, chats });
  } catch (error) {
    console.error("Error fetching phone history:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching phone history" });
  }
};
