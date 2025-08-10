import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const tags = pgTable('tags', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull()
});
