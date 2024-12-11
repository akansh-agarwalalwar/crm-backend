const express = require("express");

const router = express.Router();

const WhatsappMessage = require("../controller/whatsappMessage");

router.post("/webhook", WhatsappMessage.createWebhook);

router.get("/webhook", WhatsappMessage.getWebhook);

router.get("/getChats", WhatsappMessage.getChats);

router.post("/send", WhatsappMessage.sendMessage);

router.get("/history/:phoneNumber", WhatsappMessage.getPhoneHistory);

module.exports = router;