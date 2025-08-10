import {
  pgEnum,
  pgTable,
  integer,
  text,
  boolean
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  email: text('email').notNull().unique(),
  password: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  userName: text('username').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  followersCount: integer('followers_count').notNull().default(0),
  followsCount: integer('follows_count').notNull().default(0)
});
