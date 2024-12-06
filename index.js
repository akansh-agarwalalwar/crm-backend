const express = require("express");
const app = express();
const mongoose = require("mongoose");

const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 4000;

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
mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.error(e));

app.get("/", (req, res) => {
  res.send("Hello, this is plain text response!");
});

app.listen(PORT, () => {
  console.log(`----Server Started at ${PORT}--------------`);
});
