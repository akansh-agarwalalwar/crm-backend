const mysql = require("mysql2/promise");
require("dotenv").config()
const con = mysql.createPool({
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    host: process.env.MYSQL_HOST,
    database: process.env.MYSQL_DB,
    port: process.env.MYSQL_PORT,
    connectionLimit: 1000,
    // debug: ['ComQueryPacket']
  });

console.log(con)
console.log("object")
module.exports = con