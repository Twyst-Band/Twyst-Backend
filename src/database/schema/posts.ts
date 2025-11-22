import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from '@schema/users';
import { relations } from 'drizzle-orm';
import { tags } from '@schema/tags';
import { tagsToPosts } from '@schema/tags_to_posts';

export const posts = pgTable('posts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  userID: text('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull()
});

export const postRelations = relations(posts, ({ one, many }) => ({
  tagsToPosts: many(tagsToPosts),
  user: one(users, {
    fields: [posts.userID],
    references: [users.id]
  })
}));

export const postsGeneralSelect = {
  id: true,
  title: true,
  content: true,
  userID: true,
  createdAt: true,
  updatedAt: true
};

export const postsDeleteReplace = {
  statusField: null,
  replaceValues: {
    title: '[Deleted Post]',
    content: '[This post has been deleted]'
  }
};