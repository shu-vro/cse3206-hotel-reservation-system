import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { checkDates, findClash, nightsBetween } from './availability.js';

function dbWithBooking(checkIn, checkOut, status = 'confirmed') {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    create table bookings (
      id integer primary key autoincrement,
      room_id integer not null,
      check_in text not null,
      check_out text not null,
      status text not null
    );
  `);
  db.prepare('insert into bookings (room_id, check_in, check_out, status) values (1, ?, ?, ?)').run(
    checkIn,
    checkOut,
    status
  );
  return db;
}

test('a stay overlapping an existing booking is a clash', () => {
  const db = dbWithBooking('2026-10-10', '2026-10-14');
  assert.ok(findClash(db, 1, '2026-10-12', '2026-10-16'));
  assert.ok(findClash(db, 1, '2026-10-09', '2026-10-11'));
  assert.ok(findClash(db, 1, '2026-10-11', '2026-10-12'));
});

test('checking in the morning someone else checks out is allowed', () => {
  const db = dbWithBooking('2026-10-10', '2026-10-14');
  assert.equal(findClash(db, 1, '2026-10-14', '2026-10-17'), undefined);
  assert.equal(findClash(db, 1, '2026-10-07', '2026-10-10'), undefined);
});

test('cancelled bookings free the room up again', () => {
  const db = dbWithBooking('2026-10-10', '2026-10-14', 'cancelled');
  assert.equal(findClash(db, 1, '2026-10-11', '2026-10-13'), undefined);
});

test('other rooms are not affected', () => {
  const db = dbWithBooking('2026-10-10', '2026-10-14');
  assert.equal(findClash(db, 2, '2026-10-11', '2026-10-13'), undefined);
});

test('date rules', () => {
  const today = '2026-10-01';
  assert.equal(checkDates('2026-10-02', '2026-10-05', today), null);
  assert.match(checkDates('2026-09-30', '2026-10-05', today), /past/);
  assert.match(checkDates('2026-10-05', '2026-10-05', today), /at least one night/);
  assert.match(checkDates('2026-10-05', '2026-10-04', today), /at least one night/);
  assert.match(checkDates('05-10-2026', '2026-10-06', today), /YYYY-MM-DD/);
  assert.match(checkDates('2026-10-02', '2026-12-02', today), /30 nights/);
});

test('nights are counted across month ends', () => {
  assert.equal(nightsBetween('2026-10-30', '2026-11-02'), 3);
});
