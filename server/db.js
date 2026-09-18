import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const file = process.env.DB_FILE || join(here, '..', 'data', 'hotel.db');

if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });

export const db = new DatabaseSync(file);

db.exec('pragma foreign_keys = on');
db.exec(readFileSync(join(here, 'schema.sql'), 'utf8'));
