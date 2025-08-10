import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { exercises } from '@schema/exercises';
import { exercisePacks } from '@schema/exercise-packs';

export const exercisesToExercisePacks = pgTable(
  'exercises_to_exercise_packs',
  {
    exerciseID: integer('exerciseID')
      .notNull()
      .references(() => exercises.id),
    exercisePackID: integer('exercisePackID')
      .notNull()
      .references(() => exercisePacks.id)
  },
  (table) => [
    primaryKey({
      columns: [table.exerciseID, table.exercisePackID]
    })
  ]
);
