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
