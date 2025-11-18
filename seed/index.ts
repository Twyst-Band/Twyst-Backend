import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from '../src/database/schema';
import { seedUsers } from './users.seed';
import { clearDatabase } from './clear';
import envConfig from '../env.config';

dotenv.config();

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');

  const pool = new Pool({
    connectionString: envConfig.DB_URL
  });

  const db = drizzle(pool, { schema });

  try {
    await clearDatabase(db);
    await seedUsers(db, 100);

    console.log('\n✅ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeeds();
