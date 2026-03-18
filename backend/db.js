import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDb() {
  const db = await open({
    filename: path.join(__dirname, 'jobs.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      employment_type TEXT NOT NULL,
      seniority TEXT NOT NULL,
      salary_min INTEGER,
      salary_max INTEGER,
      remote BOOLEAN DEFAULT 0,
      description TEXT NOT NULL,
      requirements TEXT,
      posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      tags TEXT
    );
  `);

  return db;
}
