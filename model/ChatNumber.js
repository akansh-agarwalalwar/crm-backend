const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    unique: true,
    required: true,
  },
  phoneNumberId: {
    type: String,
    unique: true,
    required: true,
  },
  lastMessage: {
    type: String,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model("Chat", ChatSchema);

module.exports = Chat;
