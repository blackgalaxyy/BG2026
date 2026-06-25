import { Router } from "express";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env["NEON_DATABASE_URL"],
  ssl: { rejectUnauthorized: false },
});

const router = Router();

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

ensureTable().catch((err) => console.error("Failed to create table", err));

router.post("/contact", async (req, res) => {
  const { full_name, email, company, message } = req.body as {
    full_name?: string;
    email?: string;
    company?: string;
    message?: string;
  };

  if (!full_name || !email || !company || !message) {
    res.status(400).json({ error: "All fields are required." });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO contact_submissions (full_name, email, company, message)
       VALUES ($1, $2, $3, $4)`,
      [full_name, email, company, message],
    );
    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save contact submission");
    res.status(500).json({ error: "Failed to save submission." });
  }
});

export default router;
