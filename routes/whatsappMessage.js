const express = require("express");
const upload = require("../config/upload");
const router = express.Router();

const WhatsappMessage = require("../controller/whatsappMessage");

router.post("/webhook", WhatsappMessage.createWebhook);

router.get("/webhook", WhatsappMessage.getWebhook);

router.get("/getChats", WhatsappMessage.getChats);

router.post("/send", WhatsappMessage.sendMessage);

router.get("/history/:phoneNumber", WhatsappMessage.getPhoneHistory);

router.post(
  "/send-file",
  upload.fields([{ name: "file", maxCount: 10000 }]),
  WhatsappMessage.sendFile
);

router.get("/messages", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM messages ORDER BY createdAt ASC"
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;
