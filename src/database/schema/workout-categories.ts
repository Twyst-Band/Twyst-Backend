import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const workoutCategories = pgTable('workout_categories', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull()
});
