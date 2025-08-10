import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { equipmentCategories } from '@schema/equipment-categories';

export const equipment = pgTable('equipment', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  categoryID: integer('category_id')
    .notNull()
    .references(() => equipmentCategories.id),
  name: text('name').notNull()
});
