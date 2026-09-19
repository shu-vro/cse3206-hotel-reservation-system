import { db } from './db.js';
import { hashPassword } from './auth.js';

const sampleRooms = [
  ['101', 'Single', 1, 2400, 'Street view, one bed, desk and a kettle.'],
  ['102', 'Single', 1, 2400, 'Courtyard side, quieter in the morning.'],
  ['201', 'Double', 2, 4200, 'Two queen beds, balcony over the garden.'],
  ['202', 'Double', 3, 4600, 'Extra sofa bed, good for small families.'],
  ['301', 'Deluxe', 2, 6800, 'Corner room, bath tub, river view.'],
  ['401', 'Suite', 4, 11500, 'Separate living room, dining table for four.']
];

export function seed() {
  const staff = db.prepare("select id from users where role = 'admin'").get();
  if (!staff) {
    db.prepare("insert into users (name, email, password_hash, role) values (?, ?, ?, 'admin')").run(
      'Front Desk',
      'admin@rajshahigrand.com',
      hashPassword('admin123')
    );
  }

  const roomCount = db.prepare('select count(*) as total from rooms').get().total;
  if (roomCount === 0) {
    const insert = db.prepare(
      'insert into rooms (number, type, capacity, price_per_night, description) values (?, ?, ?, ?, ?)'
    );
    for (const room of sampleRooms) insert.run(...room);
  }
}
