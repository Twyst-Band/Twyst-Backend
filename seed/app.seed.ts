import { Pool } from 'pg';
import envConfig from '../env.config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { equipment } from '../src/database/schema/equipment';
import { equipmentCategories } from '../src/database/schema/equipment-categories';
import { workoutCategories } from '../src/database/schema/workout-categories';
import { tags } from '../src/database/schema/tags';
import { equipmentCategoryData, tagData, workoutCategoryData, equipmentItems } from './data/app.seed.data';

export async function resetDB(db: NodePgDatabase) {
  await db.delete(equipment);
  await db.delete(equipmentCategories);
  await db.delete(workoutCategories);
  await db.delete(tags);
}

async function seed() {
  const pool = new Pool({ connectionString: envConfig.DB_URL });
  const db = drizzle({ client: pool });

  await resetDB(db);

  const insertedEquipmentCategories = await db
    .insert(equipmentCategories)
    .values(equipmentCategoryData)
    .returning({ id: equipmentCategories.id, name: equipmentCategories.name });

  const equipmentData = equipmentItems.map(item => ({
    name: item.name,
    categoryID: insertedEquipmentCategories.find(c => c.name === item.categoryName)!.id
  }));

  await db.insert(tags).values(tagData);
  await db.insert(workoutCategories).values(workoutCategoryData);
  await db.insert(equipment).values(equipmentData);

  await pool.end();
}

void seed();

