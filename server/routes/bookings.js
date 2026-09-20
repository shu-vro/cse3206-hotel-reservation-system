import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { cancellable, checkDates, findClash, nightsBetween } from '../availability.js';

const router = Router();

const withRoom = `
  select b.*, r.number as room_number, r.type as room_type, u.name as guest_name, u.email as guest_email
  from bookings b
  join rooms r on r.id = b.room_id
  join users u on u.id = b.user_id
`;

router.get('/', requireAuth, (req, res) => {
  const mine = req.user.role !== 'admin' || req.query.scope === 'mine';
  const rows = mine
    ? db.prepare(`${withRoom} where b.user_id = ? order by b.check_in desc`).all(req.user.id)
    : db.prepare(`${withRoom} order by b.check_in desc`).all();

  res.json({ bookings: rows });
});

router.post('/', requireAuth, (req, res) => {
  const roomId = Number(req.body.room_id);
  const checkIn = (req.body.check_in || '').trim();
  const checkOut = (req.body.check_out || '').trim();
  const guests = Number(req.body.guests);

  const room = db.prepare('select * from rooms where id = ? and active = 1').get(roomId);
  if (!room) return res.status(404).json({ error: 'That room is not available for booking.' });

  const dateProblem = checkDates(checkIn, checkOut);
  if (dateProblem) return res.status(400).json({ error: dateProblem });

  if (!Number.isInteger(guests) || guests < 1) {
    return res.status(400).json({ error: 'Tell us how many guests are staying.' });
  }
  if (guests > room.capacity) {
    return res.status(400).json({ error: `Room ${room.number} sleeps ${room.capacity}.` });
  }

  const clash = findClash(db, roomId, checkIn, checkOut);
  if (clash) {
    return res
      .status(409)
      .json({ error: `Room ${room.number} is taken from ${clash.check_in} to ${clash.check_out}.` });
  }

  const total = nightsBetween(checkIn, checkOut) * room.price_per_night;
  const result = db
    .prepare(
      'insert into bookings (room_id, user_id, check_in, check_out, guests, total_price) values (?, ?, ?, ?, ?, ?)'
    )
    .run(roomId, req.user.id, checkIn, checkOut, guests, total);

  res.status(201).json({ booking: db.prepare(`${withRoom} where b.id = ?`).get(result.lastInsertRowid) });
});

router.post('/:id/cancel', requireAuth, (req, res) => {
  const booking = db.prepare('select * from bookings where id = ?').get(Number(req.params.id));
  if (!booking) return res.status(404).json({ error: 'No such booking.' });
  if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'That booking belongs to someone else.' });
  }
  if (booking.status === 'cancelled') {
    return res.status(409).json({ error: 'This booking is already cancelled.' });
  }
  if (!cancellable(booking.check_in)) {
    return res.status(409).json({ error: 'The stay has already started, call the front desk.' });
  }

  db.prepare("update bookings set status = 'cancelled' where id = ?").run(booking.id);
  res.json({ booking: db.prepare(`${withRoom} where b.id = ?`).get(booking.id) });
});

export default router;
