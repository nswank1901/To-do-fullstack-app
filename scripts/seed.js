import mysql from "mysql2";
import "dotenv/config";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const priorities = ["low", "medium", "high"];

function randomDate(startDate, endDate) {
  return new Date(
    startDate.getTime() +
      Math.random() * (endDate.getTime() - startDate.getTime())
  );
}

async function seedData(count = 100) {
  for (let i = 0; i < count; i++) {
    const title = `Task ${i + 1}`;
    const completed = Math.random() > 0.4; // 60% chance completed
    const createdAt = randomDate(new Date(2024, 0, 1), new Date());
    const dueDate = randomDate(createdAt, new Date(2025, 11, 31));
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const estimatedTime = Math.floor(Math.random() * 8) + 1; // 1-8 hours

    await connection.execute(
      `INSERT INTO tasks (title, completed, created_at, due_date, priority, estimated_time)
             VALUES (?, ?, ?, ?, ?, ?)`,
      [title, completed, createdAt, dueDate, priority, estimatedTime]
    );
  }
  console.log("Database seeded successfully!");
  await connection.end();
}

seedData();
