const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;
const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/todos";

const pool = new Pool({ connectionString: DATABASE_URL });

const app = express();
app.use(cors());
app.use(express.json());

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

async function connectWithRetry(retries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      await ensureTable();
      console.log("Connected to PostgreSQL");
      return;
    } catch (err) {
      console.log(
        `Postgres not ready yet (attempt ${attempt}/${retries}): ${err.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Could not connect to PostgreSQL after multiple attempts");
}

app.get("/api/todos", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, completed, "createdAt" FROM todos ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

app.post("/api/todos", async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  try {
    const result = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING id, title, completed, "createdAt"',
      [title.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM todos WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

app.patch("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE todos SET completed = NOT completed WHERE id = $1 RETURNING id, title, completed, "createdAt"',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

connectWithRetry()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
