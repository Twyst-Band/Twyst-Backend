import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '@schema/users';
import { sql } from 'drizzle-orm';

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  token: uuid('token').primaryKey().defaultRandom(),
  userID: integer('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull().default(sql`NOW() + INTERVAL '1 day'`)
});
