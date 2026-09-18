import { db } from './db.js';
import { hashPassword } from './auth.js';

export function seed() {
  const staff = db.prepare("select id from users where role = 'admin'").get();
  if (!staff) {
    db.prepare("insert into users (name, email, password_hash, role) values (?, ?, ?, 'admin')").run(
      'Front Desk',
      'admin@rajshahigrand.com',
      hashPassword('admin123')
    );
  }
}
