import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const equipmentCategories = pgTable('equipment_categories', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull()
});
