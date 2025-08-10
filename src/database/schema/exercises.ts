import { integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { workoutCategories } from '@schema/workout-categories';
import { users } from '@schema/users';

export const exerciseAccessEnum = pgEnum('exercise_type', ['private', 'public', '']);

export const exercises = pgTable('exercises', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  description: text('description'),
  difficulty: integer('difficulty').notNull(),
  categoryID: integer('category_id')
    .notNull()
    .references(() => workoutCategories.id),
  ownerID: integer('owner_id').references(() => users.id),
  ref: text('ref').notNull()
});
