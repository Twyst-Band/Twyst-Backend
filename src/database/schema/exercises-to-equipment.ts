import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { exercises } from '@schema/exercises';
import { equipment } from '@schema/equipment';

export const exercisesToEquipment = pgTable(
  'exercises_to_equipment',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    exerciseID: integer('exercise_id')
      .notNull()
      .references(() => exercises.id, {
        onDelete: 'cascade'
      }),
    equipmentID: integer('equipment_id')
      .notNull()
      .references(() => equipment.id, {
        onDelete: 'cascade'
      })
  },
  (table) => [
    primaryKey({
      columns: [table.exerciseID, table.equipmentID]
    })
  ]
);
