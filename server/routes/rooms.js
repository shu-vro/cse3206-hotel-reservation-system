import { Router } from 'express';
import { db } from '../db.js';
import { currentUser, requireAdmin } from '../auth.js';

const router = Router();

const TYPES = ['Single', 'Double', 'Deluxe', 'Suite'];

function readRoom(body) {
  return {
    number: (body.number || '').trim(),
    type: (body.type || '').trim(),
    capacity: Number(body.capacity),
    price: Number(body.price_per_night),
    description: (body.description || '').trim()
  };
}

function roomProblem(room) {
  if (!room.number) return 'Room number is required.';
  if (!TYPES.includes(room.type)) return `Type must be one of ${TYPES.join(', ')}.`;
  if (!Number.isInteger(room.capacity) || room.capacity < 1) return 'Capacity must be at least 1.';
  if (!(room.price > 0)) return 'Price per night must be greater than zero.';
  return null;
}

router.get('/', (req, res) => {
  const user = currentUser(req);
  const filters = ['(active = 1 or ?)'];
  const values = [user?.role === 'admin' && req.query.include_archived === 'true' ? 1 : 0];

  if (req.query.type) {
    filters.push('type = ?');
    values.push(req.query.type);
  }
  if (req.query.guests) {
    filters.push('capacity >= ?');
    values.push(Number(req.query.guests));
  }
  if (req.query.max_price) {
    filters.push('price_per_night <= ?');
    values.push(Number(req.query.max_price));
  }

  const rooms = db
    .prepare(`select * from rooms where ${filters.join(' and ')} order by price_per_night`)
    .all(...values);

  res.json({ rooms, types: TYPES });
});

router.get('/:id', (req, res) => {
  const room = db.prepare('select * from rooms where id = ?').get(Number(req.params.id));
  if (!room) return res.status(404).json({ error: 'No such room.' });
  res.json({ room });
});

router.post('/', requireAdmin, (req, res) => {
  const room = readRoom(req.body);
  const problem = roomProblem(room);
  if (problem) return res.status(400).json({ error: problem });

  const clash = db.prepare('select id from rooms where number = ?').get(room.number);
  if (clash) return res.status(409).json({ error: `Room ${room.number} already exists.` });

  const result = db
    .prepare(
      'insert into rooms (number, type, capacity, price_per_night, description) values (?, ?, ?, ?, ?)'
    )
    .run(room.number, room.type, room.capacity, room.price, room.description);

  res.status(201).json({ room: db.prepare('select * from rooms where id = ?').get(result.lastInsertRowid) });
});

router.patch('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('select * from rooms where id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'No such room.' });

  const room = readRoom({ ...existing, ...req.body });
  const problem = roomProblem(room);
  if (problem) return res.status(400).json({ error: problem });

  db.prepare(
    'update rooms set number = ?, type = ?, capacity = ?, price_per_night = ?, description = ? where id = ?'
  ).run(room.number, room.type, room.capacity, room.price, room.description, id);

  res.json({ room: db.prepare('select * from rooms where id = ?').get(id) });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const room = db.prepare('select * from rooms where id = ?').get(id);
  if (!room) return res.status(404).json({ error: 'No such room.' });

  db.prepare('update rooms set active = 0 where id = ?').run(id);
  res.status(204).end();
});

export default router;
