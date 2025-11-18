import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '@schema/users';

export async function clearDatabase(db: NodePgDatabase<any>): Promise<void> {
  console.log('\n🗑️  Clearing database...');

  try {
    await db.delete(users);
    console.log('✅ Cleared users table');
    console.log('✅ Database cleared successfully\n');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

export async function clearTable(
  db: NodePgDatabase<any>,
  tableName: 'users'
): Promise<void> {
  console.log(`\n🗑️  Clearing ${tableName} table...`);

  try {
    switch (tableName) {
      case 'users':
        await db.delete(users);
        break;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }

    console.log(`✅ Cleared ${tableName} table\n`);
  } catch (error) {
    console.error(`❌ Error clearing ${tableName}:`, error);
    throw error;
  }
}
