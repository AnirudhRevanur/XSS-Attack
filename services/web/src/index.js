const express = require("express");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");

const routes = require("./routes");
const pool = require("./db");

const path = require("path");
const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:6379`
});

redisClient.connect().catch(console.error);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: "lab-secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use(async (req, res, next) => {
  // Refresh user data from database if logged in
  if (req.session?.user?.id) {
    try {
      const result = await pool.query(
        "SELECT id, username, role FROM users WHERE id=$1",
        [req.session.user.id]
      );
      if (result.rows.length > 0) {
        req.session.user = result.rows[0];
      }
    } catch (err) {
      // If user doesn't exist, clear session
      req.session.user = null;
    }
  }
  res.locals.user = req.session?.user ?? null;
  res.locals.flash = req.session?.flash ?? null;
  if (req.session?.flash) delete req.session.flash;
  next();
});

app.use(routes);

app.listen(3000, () => {
  console.log("Web running");
});
