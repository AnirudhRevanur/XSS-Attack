const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  user: "lab",
  password: "labpass",
  database: "labdb"
});

module.exports = pool;
