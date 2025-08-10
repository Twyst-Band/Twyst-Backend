import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { users } from '@schema/users';

export const workouts = pgTable('workouts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  description: text('description'),
  ownerID: integer('owner_id').references(() => users.id),
  duration: integer('duration').notNull(),
  difficulty: integer('difficulty').notNull(),

});
