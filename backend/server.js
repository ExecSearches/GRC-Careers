import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { initDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@grccareers.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let db;
initDb().then((database) => {
  db = database;
  console.log('DB initialized');
}).catch((err) => {
  console.error('DB init error', err);
  process.exit(1);
});

function makeToken(email) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ email, iat: Date.now(), exp: Date.now() + 86400000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + payload).digest('base64url');
  return header + '.' + payload + '.' + sig;
}

function verifyToken(token) {
  try {
    const [header, payload, sig] = token.split('.');
    const check = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + payload).digest('base64url');
    if (check !== sig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const user = verifyToken(auth.slice(7));
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = user;
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'GRC-Jobs-Board' });
});

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = makeToken(email);
    return res.json({ token, email });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  try {
    const total = await db.get('SELECT COUNT(*) as count FROM jobs');
    res.json({ totalJobs: total.count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/jobs', authMiddleware, async (req, res) => {
  try {
    const jobs = await db.all('SELECT * FROM jobs ORDER BY datetime(posted_at) DESC');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/jobs', authMiddleware, async (req, res) => {
  try {
    const { title, company, location, employment_type, seniority, salary_min, salary_max, remote, description, apply_url, tags, category, posted_date } = req.body;
    if (!title || !company) return res.status(400).json({ error: 'Title and company required' });
    const result = await db.run(
      'INSERT INTO jobs (title, company, location, employment_type, seniority, salary_min, salary_max, remote, description, apply_url, tags) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [title, company, location || '', employment_type || 'Full-time', seniority || 'Senior', salary_min || null, salary_max || null, remote ? 1 : 0, description || '', apply_url || '', tags || category || '']
    );
    res.status(201).json({ id: result.lastID, message: 'Job created' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/jobs/bulk', authMiddleware, async (req, res) => {
  try {
    const { jobs } = req.body;
    if (!Array.isArray(jobs)) return res.status(400).json({ error: 'jobs array required' });
    let imported = 0;
    for (const job of jobs) {
      if (!job.title || !job.company) continue;
      await db.run(
        'INSERT INTO jobs (title, company, location, employment_type, seniority, salary_min, salary_max, remote, description, apply_url, tags) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [job.title, job.company, job.location || '', job.type || 'Full-time', 'Senior', job.salary_min || null, job.salary_max || null, job.remote === 'Remote' ? 1 : 0, job.description || '', job.url || '', job.category || '']
      );
      imported++;
    }
    res.json({ imported, total: jobs.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/jobs/:id', authMiddleware, async (req, res) => {
  try {
    await db.run('DELETE FROM jobs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const { q, location, seniority, employment_type, remote, category } = req.query;
    const conditions = [];
    const params = [];
    if (q) { conditions.push('(title LIKE ? OR company LIKE ? OR description LIKE ? OR tags LIKE ?)'); const like = '%' + q + '%'; params.push(like, like, like, like); }
    if (location) { conditions.push('location LIKE ?'); params.push('%' + location + '%'); }
    if (seniority) { conditions.push('seniority = ?'); params.push(seniority); }
    if (employment_type) { conditions.push('employment_type = ?'); params.push(employment_type); }
    if (remote === 'true') { conditions.push('remote = 1'); }
    if (category) { conditions.push('tags LIKE ?'); params.push('%' + category + '%'); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const jobs = await db.all('SELECT id, title, company, location, employment_type, seniority, salary_min, salary_max, remote, description, tags, posted_at FROM jobs ' + where + ' ORDER BY datetime(posted_at) DESC LIMIT 200', params);
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await db.get('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log('GRC-Jobs-Board API running on port ' + PORT);
});
