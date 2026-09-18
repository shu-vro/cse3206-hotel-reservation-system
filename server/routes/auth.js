import { Router } from 'express';
import { db } from '../db.js';
import { checkPassword, currentUser, endSession, hashPassword, startSession } from '../auth.js';

const router = Router();

const emailLooksValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

router.post('/register', (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!name || !emailLooksValid(email)) {
    return res.status(400).json({ error: 'Name and a valid email are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const taken = db.prepare('select id from users where email = ?').get(email);
  if (taken) return res.status(409).json({ error: 'That email is already registered.' });

  const result = db
    .prepare('insert into users (name, email, password_hash) values (?, ?, ?)')
    .run(name, email, hashPassword(password));

  const user = { id: Number(result.lastInsertRowid), name, email, role: 'guest' };
  res.status(201).json({ token: startSession(user.id), user });
});

router.post('/login', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  const row = db.prepare('select * from users where email = ?').get(email);
  if (!row || !checkPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }

  res.json({
    token: startSession(row.id),
    user: { id: row.id, name: row.name, email: row.email, role: row.role }
  });
});

router.post('/logout', (req, res) => {
  const header = req.get('authorization') || '';
  if (header.startsWith('Bearer ')) endSession(header.slice(7));
  res.status(204).end();
});

router.get('/me', (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not logged in.' });
  res.json({ user });
});

export default router;
