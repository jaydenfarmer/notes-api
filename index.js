const express = require("express");
const app = express();
const PORT = 3000;

const bcrypt = require("bcrypt");
app.use(express.json());

const db = new sqlite3.Database("./notes.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id)
)`);

app.get("/", (req, res) => {
  res.send("Notes API is running 🚀");
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  const saltRounds = 10;

  const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.error("Error registering user:", err.message);
      res.status(500).json({ error: "Internal server error" });
    } else {
      db.run(sql, [username, email, hash], function (err) {
        if (err) {
          console.error("Error registering user:", err.message);
          res.status(500).json({ error: "Internal server error" });
        } else {
          res.status(201).json({ id: this.lastID, username, email });
        }
      });
    }
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = ?";
  db.get(sql, [username], (err, row) => {
    if (err) {
      console.error("Error logging in:", err.message);
      res.status(500).json({ error: "Internal server error" });
    } else if (row) {
      bcrypt.compare(password, row.password, (err, result) => {
        if (err) {
          console.error("Error comparing passwords:", err.message);
          res.status(500).json({ error: "Internal server error" });
        } else if (result) {
          res
            .status(200)
            .json({ id: row.id, username: row.username, email: row.email });
        } else {
          res.status(401).json({ error: "Invalid username or password" });
        }
      });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Root endpoint accessed");
});
