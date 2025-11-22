import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tags } from '@schema/tags';
import { posts } from '@schema/posts';

export const tagsToPosts = pgTable(
  'tags_to_posts',
  {
    tagID: integer('tag_id')
      .notNull()
      .references(() => tags.id),
    postID: integer('post_id')
      .notNull()
      .references(() => posts.id)
  },
  (table) => [
    primaryKey({
      columns: [table.tagID, table.postID]
    })
  ]
);

export const tagsToPostsRelations = relations(tagsToPosts, ({ one }) => ({
  tag: one(tags, {
    fields: [tagsToPosts.tagID],
    references: [tags.id]
  }),
  post: one(posts, {
    fields: [tagsToPosts.postID],
    references: [posts.id]
  })
}));

export const tagsToPostsGeneralSelect = {
  tagID: true,
  postID: true
};

export const tagsToPostsDeleteReplace = {
  statusField: null,
  replaceValues: null
};
