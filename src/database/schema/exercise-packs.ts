import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const exercisePacks = pgTable('exercise_packs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  price: integer('price').notNull()
});
