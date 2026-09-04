// lib/db.js - Shared database configuration
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT) || 4000,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_NAME,
  ssl: process.env.MYSQL_SSL === '1' ? { rejectUnauthorized: true } : false,
};

async function getConnection() {
  return mysql.createConnection(dbConfig);
}

module.exports = { getConnection, dbConfig };