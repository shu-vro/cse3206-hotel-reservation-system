create table if not exists users (
  id integer primary key autoincrement,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'guest',
  created_at text not null default (datetime('now'))
);
