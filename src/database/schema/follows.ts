import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { users } from '@schema/users';

export const follows = pgTable(
  'follows',
  {
    followerID: integer('follower_id')
      .notNull()
      .references(() => users.id),
    followeeID: integer('followee_id')
      .notNull()
      .references(() => users.id)
  },
  (table) => [
    primaryKey({
      columns: [table.followerID, table.followeeID]
    })
  ]
);
