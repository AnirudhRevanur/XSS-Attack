const express = require("express");
const pool = require("./db");

const app = express();
app.use(express.json());

app.get("/internal/user/:id", async (req, res) => {

  const trusted = req.headers["x-internal-auth"];

  if (trusted !== "api-secret")
    return res.status(403).send("internal only");

  const result = await pool.query(
    "SELECT id, username, role FROM users WHERE id=$1",
    [req.params.id]
  );

  res.json(result.rows[0]);
});

app.listen(3000, () => {
  console.log("API running");
});
