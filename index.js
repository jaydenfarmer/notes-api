const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

const saltRounds = 10;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./notes.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

app.get("/", (req, res) => {
  res.send("Notes API is running 🚀");
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

app.post("/notes", authenticateToken, (req, res) => {
  const { title, content } = req.body;
  db.run(
    `INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)`,
    [req.user.id, title, content],
    function (err) {
      if (err) {
        console.error("Error creating note:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res
          .status(201)
          .json({ id: this.lastID, user_id: req.user.id, title, content });
      }
    }
  );
});

app.put("/notes/:id", authenticateToken, (req, res) => {
  const noteId = req.params.id;
  const { title, content } = req.body;
  db.run(
    `UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?`,
    [title, content, noteId, req.user.id],
    function (err) {
      if (err) {
        console.error("Error updating note:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else if (this.changes === 0) {
        res.status(404).json({ error: "Note not found or not owned by user" });
      } else {
        res
          .status(200)
          .json({ id: noteId, user_id: req.user.id, title, content });
      }
    }
  );
});

app.delete("/notes/:id", authenticateToken, (req, res) => {
  const noteId = req.params.id;
  db.run(
    `DELETE FROM notes WHERE id = ? AND user_id = ?`,
    [noteId, req.user.id],
    function (err) {
      if (err) {
        console.error("Error deleting note:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else if (this.changes === 0) {
        res.status(404).json({ error: "Note not found or not owned by user" });
      } else {
        res.status(200).json({ message: "Note deleted successfully" });
      }
    }
  );
});

app.get("/notes", authenticateToken, (req, res) => {
  const sql = "SELECT * FROM notes WHERE user_id = ?";
  db.all(sql, [req.user.id], (err, notes) => {
    if (err) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.status(200).json(notes);
    }
  });
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;

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
  const secretKey = process.env.JWT_SECRET || "your_secret_key";

  db.get(sql, [username], (err, user) => {
    if (err) {
      console.error("Error logging in:", err.message);
      res.status(500).json({ error: "Internal server error" });
    } else if (user) {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          console.error("Error comparing passwords:", err.message);
          res.status(500).json({ error: "Internal server error" });
        } else if (result) {
          const token = jwt.sign(
            { id: user.id, username: user.username },
            secretKey,
            { expiresIn: "1h" }
          );
          res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email,
            token,
          });
        } else {
          res.status(401).json({ error: "Invalid username or password" });
        }
      });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  });
});

function authenticateToken(req, res, next) {
  const token =
    req.headers["authorization"] && req.headers["authorization"].split(" ")[1];
  const secretKey = process.env.JWT_SECRET || "your_secret_key";

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(401).json({ error: "Invalid access token" });
    }
    req.user = user;
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
