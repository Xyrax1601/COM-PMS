import dotenv from 'dotenv';
dotenv.config();

import { connectDB, closeDB } from '../config/db.js';
import { seedDatabase } from '../utils/seedData.js';

async function run() {
  try {
    await connectDB();
    await seedDatabase(true);
    await closeDB();
    console.log('[Seed] Database seeded and engine cleanly closed.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

run();
