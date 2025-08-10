import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { exercises } from '@schema/exercises';
import { tags } from '@schema/tags';

export const exercisesToEquipment = pgTable(
  'exercises_to_equipment',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    exerciseID: integer('exercise_id')
      .notNull()
      .references(() => exercises.id),
    equipmentID: integer('equipment_id')
      .notNull()
      .references(() => tags.id)
  },
  (table) => [
    primaryKey({
      columns: [table.exerciseID, table.equipmentID]
    })
  ]
);
