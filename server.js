
const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
const PORT = 3000;

// Change password below if your MySQL root password is different.
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "student_management"
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

db.connect(error => {
  if (error) {
    console.error("MySQL connection failed:", error.message);
    console.error("Check MySQL is running, your password, and database name.");
    process.exit(1);
  }
  console.log("Connected to MySQL successfully.");
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Read all students
app.get("/students", (req, res) => {
  db.query(
    "SELECT id, name, email, course FROM students ORDER BY id DESC",
    (error, rows) => {
      if (error) return databaseError(res, error);
      res.json(rows);
    }
  );
});

// Create student. ID is generated automatically by MySQL.
app.post("/students", (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
  const course = typeof req.body.course === "string" ? req.body.course.trim() : "";

  if (!name || !course) {
    return res.status(400).json({
      error: "Student name and course are required."
    });
  }

  if (name.length > 100 || email.length > 150 || course.length > 100) {
    return res.status(400).json({ error: "One or more fields are too long." });
  }

  db.query(
    "INSERT INTO students (name, email, course) VALUES (?, ?, ?)",
    [name, email || null, course],
    (error, result) => {
      if (error) return databaseError(res, error);

      res.status(201).json({
        message: "Student created successfully!",
        student: {
          id: result.insertId,
          name,
          email: email || null,
          course
        }
      });
    }
  );
});

// Read one student by ID
app.get("/students/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Please enter a valid student ID." });
  }

  db.query(
    "SELECT id, name, email, course FROM students WHERE id = ?",
    [id],
    (error, rows) => {
      if (error) return databaseError(res, error);
      if (rows.length === 0) {
        return res.status(404).json({ error: "No student found with that ID." });
      }
      res.json({ student: rows[0] });
    }
  );
});

// Update student by ID
app.put("/students/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Please enter a valid student ID." });
  }

  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
  const course = typeof req.body.course === "string" ? req.body.course.trim() : "";

  if (!name || !course) {
    return res.status(400).json({
      error: "Student name and course are required."
    });
  }

  if (name.length > 100 || email.length > 150 || course.length > 100) {
    return res.status(400).json({ error: "One or more fields are too long." });
  }

  db.query(
    "UPDATE students SET name = ?, email = ?, course = ? WHERE id = ?",
    [name, email || null, course, id],
    (error, result) => {
      if (error) return databaseError(res, error);
      if (result.affectedRows === 0) {
        return db.query(
          "SELECT id FROM students WHERE id = ?",
          [id],
          (lookupError, rows) => {
            if (lookupError) return databaseError(res, lookupError);
            if (rows.length === 0) {
              return res.status(404).json({ error: "No student found with that ID." });
            }
            res.json({ message: "Student details are unchanged." });
          }
        );
      }
      res.json({ message: "Student updated successfully." });
    }
  );
});

// Delete student by ID
app.delete("/students/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Please enter a valid student ID." });
  }

  db.query("DELETE FROM students WHERE id = ?", [id], (error, result) => {
    if (error) return databaseError(res, error);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No student found with that ID." });
    }
    res.json({ message: "Student deleted successfully." });
  });
});

function parseId(value) {
  if (!/^[1-9]\d*$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function databaseError(res, error) {
  console.error("Database error:", error.message);
  return res.status(500).json({
    error: "Database error. Check the VS Code terminal."
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
