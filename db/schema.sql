-- Create the database
CREATE DATABASE IF NOT EXISTS todo_db
USE todo_db;

-- Create the tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    estimated_time INT DEFAULT 0
);

-- Optional queries for testing
-- SELECT * FROM tasks;
-- SELECT * FROM tasks WHERE completed = TRUE;
