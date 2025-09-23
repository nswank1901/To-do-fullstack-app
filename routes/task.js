const express = require("express");
const router = express.Router();
const db = require("../db/db.js");

// GET /tasks - fetch all tasks
router.get("/", (req, res) => {
  db.query("SELECT * FROM tasks", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching tasks from database");
    }
    res.json(results); // send tasks as JSON
  });
});

// POST /tasks - add a new task
router.post("/", (req, res) => {
  const { title, completed } = req.body; // get the task title from the request body

  if (!title) {
    res.status(400).send("Task title is required");
  }

  // Default to false if the user didn't provide a value for 'completed'
  // const isCompleted = completed ? 1 : 0;
  let isCompleted;
  if (completed === undefined) {
    isCompleted = 0; // default
  } else if (completed === true || completed === "true") {
    isCompleted = 1; // user explicitly sets true
  } else {
    isCompleted = 0; // user explicitly sets false
  }

  const sql = "INSERT INTO tasks (title, completed) VALUES(?, ?)";
  db.query(sql, [title, isCompleted], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error adding task to database");
    }
    res
      .status(201)
      .json({ id: result.insertID, title, completed: isCompleted });
  });
});

// UPDATE /tasks:id - mark a task as completed (or update title)
router.patch("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, completed } = req.body;

  // Build SQL dynamically depending on what is being updated (task or title)
  let sql = "UPDATE tasks SET ";
  const fields = [];
  const values = [];

  let isCompleted;

  if (title !== undefined) {
    fields.push("title = ?");
    values.push(title);
  }
  if (completed !== undefined) {
    isCompleted = completed === true || completed === "true" ? 1 : 0;
    fields.push("completed = ?");
    values.push(isCompleted);
  }

  // No fields
  if (fields.length === 0) {
    return res.status(400).send("No fields to update");
  }

  sql += fields.join(", ") + " WHERE id = ?";
  values.push(id);

  db.query(sql, values, (error, result) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Error updating task in database");
    }
    if (result.affectedRows === 0) {
      return res.status(404).send("Task not found");
    }

    // Build response object dynamically
    const response = { id };
    if (title !== undefined) response.title = title;
    if (completed !== undefined) response.completed = isCompleted;

    res.json(response);
  });
});

// DELETE /tasks:id - delete a task by id
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);

  const sql = "DELETE FROM tasks WHERE id = ?";
  db.query(sql, [id], (error, result) => {
    if (error) {
      console.error(err);
      return res.status(500).send("Error deleting task from database");
    }
    if (result.affectedRows === 0) {
      return res.status(404).send("Task not found");
    }

    res.send(`Task with ID ${id} deleted`);
  });
});

module.exports = router;
