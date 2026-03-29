const express = require("express");
const fetch = require("node-fetch");
const pool = require("./db");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Health Endpoint Definitions
|--------------------------------------------------------------------------
| visibility:
|   public -> visible to everyone
|   admin  -> visible only to admins
|
*/

const healthEndpoints = [
  {
    path: "/register",
    method: "POST",
    visibility: "public",
    input: { body: ["username", "password"] }
  },
  {
    path: "/login",
    method: "POST",
    visibility: "public",
    input: { body: ["username", "password"] }
  },
  {
    path: "/admin-users",
    method: "GET",
    visibility: "admin",
    input: { session: ["user (required)"] }
  },
  {
    path: "/profile",
    method: "GET",
    visibility: "public",
    input: { session: ["user (required)"] }
  },
  {
    path: "/post",
    method: "POST",
    visibility: "public",
    input: {
      body: ["content"],
      session: ["user (required)"]
    }
  },
  {
    path: "/posts",
    method: "GET",
    visibility: "public",
    input: null
  },
  {
    path: "/board",
    method: "GET",
    visibility: "public",
    input: null
  }
];


// ==================== ROUTES ====================

router.get("/", (req, res) => {
  res.render("layout", { partial: "home", title: "Home" });
});

router.get("/login", (req, res) => {
  res.render("layout", { partial: "login", title: "Login" });
});

router.get("/register", (req, res) => {
  res.render("layout", { partial: "register", title: "Register" });
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) {
    req.session.flash = { message: "Username and password required", type: "error" };
    return res.redirect("/register");
  }

  try {
    await pool.query(
      "INSERT INTO users(username,password,role) VALUES($1,$2,'user')",
      [username.trim(), password]
    );
    req.session.flash = { message: "Account created. Log in below.", type: "success" };
    res.redirect("/login");
  } catch (err) {
    req.session.flash = {
      message: err.code === "23505"
        ? "Username already taken"
        : "Registration failed",
      type: "error"
    };
    res.redirect("/register");
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE username=$1 AND password=$2",
    [username, password]
  );

  if (result.rows.length === 0) {
    req.session.flash = { message: "Invalid username or password", type: "error" };
    return res.redirect("/login");
  }

  req.session.user = result.rows[0];
  req.session.flash = { message: "Logged in", type: "success" };
  res.redirect("/board");
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

router.get("/admin-users", async (req, res) => {
  if (!req.session.user) return res.status(401).send("login");

  const response = await fetch(
    `http://${process.env.ADMIN_HOST}:3000/admin/users`,
    {
      method: "POST",
      headers: { "x-role": req.session.user.role }
    }
  );

  res.send(await response.text());
});

router.get("/admin/users", async (req, res) => {
  if (!req.session.user) {
    req.session.flash = { message: "Please log in", type: "error" };
    return res.redirect("/login");
  }

  if (req.session.user.role !== "admin") {
    req.session.flash = { message: "Admin only", type: "error" };
    return res.redirect("/board");
  }

  const response = await fetch(
    `http://${process.env.ADMIN_HOST}:3000/admin/users`,
    { method: "POST", headers: { "x-role": req.session.user.role } }
  );

  let users = [];
  try {
    users = JSON.parse(await response.text());
  } catch (_) { }

  // Fetch posts for admin page
  const postsResult = await pool.query(
    "SELECT * FROM posts ORDER BY id DESC"
  );

  res.render("layout", {
    partial: "admin-users",
    title: "Admin",
    users,
    posts: postsResult.rows
  });
});

router.get("/profile", async (req, res) => {
  if (!req.session.user) {
    req.session.flash = { message: "Please log in", type: "error" };
    return res.redirect("/login");
  }

  const result = await pool.query(
    "SELECT id, username, role FROM users WHERE id=$1",
    [req.session.user.id]
  );

  res.render("layout", {
    partial: "profile",
    title: "Profile",
    profile: result.rows[0]
  });
});

router.get("/lookup/:id", async (req, res) => {
  if (!req.session.user)
    return res.status(401).send("login");

  const response = await fetch(
    `http://${process.env.API_HOST}:3000/internal/user/${req.params.id}`,
    { headers: { "x-internal-auth": "api-secret" } }
  );

  res.send(await response.text());
});

router.post("/post", async (req, res) => {
  if (!req.session.user) {
    req.session.flash = { message: "Please log in to post", type: "error" };
    return res.redirect("/login");
  }

  const content = req.body.content?.trim();
  if (!content) {
    req.session.flash = { message: "Post content required", type: "error" };
    return res.redirect("/board");
  }

  await pool.query(
    "INSERT INTO posts(author, content) VALUES($1, $2)",
    [req.session.user.username, content]
  );

  req.session.flash = { message: "Post created", type: "success" };
  res.redirect("/board");
});

router.get("/posts", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM posts ORDER BY id DESC"
  );
  res.json(result.rows);
});

router.get("/board", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM posts ORDER BY id DESC"
  );
  res.render("layout", {
    partial: "board",
    title: "Board",
    posts: result.rows
  });
});

router.get("/whoami", (req, res) => {
  res.json({
    user: req.session.user
      ? {
        id: req.session.user.id,
        username: req.session.user.username,
        role: req.session.user.role
      }
      : null
  });
});

router.post("/admin/query", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.status(403).send("forbidden");

  try {
    const result = await pool.query(req.body.q);
    res.json(result.rows);
  } catch (e) {
    res.send(e.message);
  }
});

router.post("/promote", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.status(403).send("forbidden");

  const { id } = req.body;

  await pool.query(
    "UPDATE users SET role='admin' WHERE id=$1",
    [id]
  );

  if (req.session.user.id == id) {
    const result = await pool.query(
      "SELECT * FROM users WHERE id=$1",
      [id]
    );
    req.session.user = result.rows[0];
  }

  req.session.flash = {
    message: "User promoted to admin",
    type: "success"
  };

  res.redirect("/admin/users");
});

router.post("/admin/users/create", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    req.session.flash = { message: "Admin only", type: "error" };
    return res.redirect("/board");
  }

  const { username, password, role } = req.body;
  if (!username?.trim() || !password) {
    req.session.flash = { message: "Username and password required", type: "error" };
    return res.redirect("/admin/users");
  }

  const userRole = role || "user";

  try {
    await pool.query(
      "INSERT INTO users(username, password, role) VALUES($1, $2, $3)",
      [username.trim(), password, userRole]
    );
    req.session.flash = { message: "User created successfully", type: "success" };
  } catch (err) {
    req.session.flash = {
      message: err.code === "23505"
        ? "Username already taken"
        : "Failed to create user",
      type: "error"
    };
  }

  res.redirect("/admin/users");
});

router.post("/admin/users/delete", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    req.session.flash = { message: "Admin only", type: "error" };
    return res.redirect("/board");
  }

  const { id } = req.body;
  if (!id) {
    req.session.flash = { message: "User ID required", type: "error" };
    return res.redirect("/admin/users");
  }

  // Prevent deleting yourself
  if (req.session.user.id == id) {
    req.session.flash = { message: "Cannot delete your own account", type: "error" };
    return res.redirect("/admin/users");
  }

  try {
    await pool.query("DELETE FROM users WHERE id=$1", [id]);
    req.session.flash = { message: "User deleted successfully", type: "success" };
  } catch (err) {
    req.session.flash = { message: "Failed to delete user", type: "error" };
  }

  res.redirect("/admin/users");
});

router.post("/admin/posts/delete", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    req.session.flash = { message: "Admin only", type: "error" };
    return res.redirect("/board");
  }

  const { id } = req.body;
  if (!id) {
    req.session.flash = { message: "Post ID required", type: "error" };
    return res.redirect("/admin/users");
  }

  try {
    await pool.query("DELETE FROM posts WHERE id=$1", [id]);
    req.session.flash = { message: "Post deleted successfully", type: "success" };
  } catch (err) {
    req.session.flash = { message: "Failed to delete post", type: "error" };
  }

  res.redirect("/admin/users");
});


/*
|--------------------------------------------------------------------------
| HEALTH ROUTE (ROLE AWARE)
|--------------------------------------------------------------------------
*/

router.get("/health", (req, res) => {
  const role = req.session.user?.role || "guest";

  const visibleEndpoints = healthEndpoints.filter(e =>
    e.visibility === "public" ||
    (e.visibility === "admin" && role === "admin")
  );

  res.json({
    status: "ok",
    service: "web",
    uptime: process.uptime(),
    role,
    endpoints: visibleEndpoints
  });
});

module.exports = router;
