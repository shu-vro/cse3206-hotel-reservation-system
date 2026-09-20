create table if not exists users (
  id integer primary key autoincrement,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'guest',
  created_at text not null default (datetime('now'))
);

create table if not exists rooms (
  id integer primary key autoincrement,
  number text not null unique,
  type text not null,
  capacity integer not null,
  price_per_night real not null,
  description text not null default '',
  active integer not null default 1
);

create table if not exists bookings (
  id integer primary key autoincrement,
  room_id integer not null references rooms(id),
  user_id integer not null references users(id),
  check_in text not null,
  check_out text not null,
  guests integer not null,
  total_price real not null,
  status text not null default 'confirmed',
  created_at text not null default (datetime('now'))
);

create index if not exists idx_bookings_room_dates on bookings (room_id, check_in, check_out);
