import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '@schema/users';
import { sql } from 'drizzle-orm';

export const passwordResetTokens = pgTable('password_reset_tokens', {
  token: uuid('token').primaryKey().defaultRandom(),
  userID: integer('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull().default(sql`NOW() + INTERVAL '15 minutes'`)
});

export const passwordResetTokensGeneralSelect = {
  token: true,
  userID: true,
  createdAt: true,
  expiresAt: true
};

export const passwordResetTokensDeleteReplace = {
  statusField: null,
  replaceValues: null
};