import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { exercises } from '@schema/exercises';
import { tags } from '@schema/tags';

export const exercisesToTags = pgTable(
  'exercises_to_tags',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    exerciseID: integer('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    tagID: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' })
  },
  (table) => [
    primaryKey({
      columns: [table.exerciseID, table.tagID]
    })
  ]
);
