import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

let db;
initDb().then((database) => {
  db = database;
  console.log('DB initialized');
}).catch((err) => {
  console.error('DB init error', err);
  process.exit(1);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'GRC-Jobs-Board' });
});

app.get('/api/jobs', async (req, res) => {
  try {
    const { q, location, seniority, employment_type, remote } = req.query;
    const conditions = [];
    const params = [];

    if (q) {
      conditions.push('(title LIKE ? OR company LIKE ? OR description LIKE ? OR tags LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (location) {
      conditions.push('location LIKE ?');
      params.push(`%${location}%`);
    }
    if (seniority) {
      conditions.push('seniority = ?');
      params.push(seniority);
    }
    if (employment_type) {
      conditions.push('employment_type = ?');
      params.push(employment_type);
    }
    if (remote === 'true') {
      conditions.push('remote = 1');
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT id, title, company, location, employment_type, seniority, salary_min, salary_max, remote, posted_at, tags FROM jobs ${whereClause} ORDER BY datetime(posted_at) DESC LIMIT 100;`;
    const jobs = await db.all(sql, params);
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching jobs', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await db.get('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error('Error fetching job', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { title, company, location, employment_type, seniority, salary_min, salary_max, remote, description, requirements, tags } = req.body;
    if (!title || !company || !location || !employment_type || !seniority || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await db.run(`INSERT INTO jobs (title, company, location, employment_type, seniority, salary_min, salary_max, remote, description, requirements, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [title, company, location, employment_type, seniority, salary_min || null, salary_max || null, remote ? 1 : 0, description, requirements || '', tags ? tags.join(',') : null]);
    const created = await db.get('SELECT * FROM jobs WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating job', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM jobs WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting job', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`GRC-Jobs-Board API running on port ${PORT}`);
});
