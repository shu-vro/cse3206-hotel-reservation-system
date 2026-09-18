import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from './db.js';

const sessions = new Map();

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function checkPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const attempt = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, 'hex');
  return attempt.length === original.length && timingSafeEqual(attempt, original);
}

export function startSession(userId) {
  const token = randomUUID();
  sessions.set(token, userId);
  return token;
}

export function endSession(token) {
  sessions.delete(token);
}

export function currentUser(req) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const userId = token && sessions.get(token);
  if (!userId) return null;
  return db.prepare('select id, name, email, role from users where id = ?').get(userId) || null;
}

export function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Please log in first.' });
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only.' });
    }
    next();
  });
}
