const express = require("express");
const tasksRouter = require('./routes/task.js');
const db = require("./db/db.js");
const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// http://localhost:3000/
app.use(express.static("public"));

// Hook router into the server
app.use('/tasks', tasksRouter);

app.listen(PORT, () => {
  console.log(`Server running on http:://localhost:${PORT}`);
});

