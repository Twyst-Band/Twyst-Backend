import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull()
});
