const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function nightsBetween(checkIn, checkOut) {
  const ms = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

export function checkDates(checkIn, checkOut, today = new Date().toISOString().slice(0, 10)) {
  if (!DATE.test(checkIn) || !DATE.test(checkOut)) return 'Use dates in YYYY-MM-DD form.';
  if (checkIn < today) return 'Check-in cannot be in the past.';
  if (nightsBetween(checkIn, checkOut) < 1) return 'Check-out must be at least one night after check-in.';
  if (nightsBetween(checkIn, checkOut) > 30) return 'Stays longer than 30 nights need a phone call.';
  return null;
}

export function cancellable(checkIn, today = new Date().toISOString().slice(0, 10)) {
  return checkIn > today;
}

// Two stays clash only when they share a night. A guest checking out on the
// same morning another checks in is fine, so the comparison stays strict.
export function findClash(db, roomId, checkIn, checkOut, ignoreBookingId = 0) {
  return db
    .prepare(
      `select id, check_in, check_out from bookings
       where room_id = ?
         and status <> 'cancelled'
         and id <> ?
         and check_in < ?
         and check_out > ?
       limit 1`
    )
    .get(roomId, ignoreBookingId, checkOut, checkIn);
}
