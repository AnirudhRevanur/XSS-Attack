const express = require("express");
const pool = require("./db.js")

const app = express();
app.use(express.json());

app.post("/admin/users", async (req, res) => {

  const role = req.headers["x-role"];

  if (role !== "admin")
    return res.status(403).send("forbidden");

  const result = await pool.query(
    "SELECT id, username, role FROM users"
  );

  res.json(result.rows);
});

app.listen(3000, () => {
  console.log("Admin running");
});
