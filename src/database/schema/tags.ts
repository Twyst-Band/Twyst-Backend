import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tagsToPosts } from '@schema/tags_to_posts';

export const tags = pgTable('tags', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull()
});

export const tagRelations = relations(tags, ({ many }) => ({
  tagsToPosts: many(tagsToPosts)
}));

export const tagsGeneralSelect = {
  id: true,
  name: true
};

export const tagsDeleteReplace = {
  statusField: null,
  replaceValues: null
};
