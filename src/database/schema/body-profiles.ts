import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text
} from 'drizzle-orm/pg-core';
import { users } from '@schema/users';

export const bodyProfiles = pgTable('body_profiles', {
  id: integer('id').notNull().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  userID: integer('user_id')
    .notNull()
    .references(() => users.id),
  addedManually: boolean('added_manually').notNull(),
  detectionDump: jsonb('detection_dump'),
  leftLowerArm: real('left_lower_arm').notNull(),
  rightLowerArm: real('right_lower_arm').notNull(),
  leftUpperArm: real('left_upper_arm').notNull(),
  rightUpperArm: real('right_upper_arm').notNull(),
  leftLowerLeg: real('left_lower_leg').notNull(),
  rightLowerLeg: real('right_lower_leg').notNull(),
  leftUpperLeg: real('left_upper_leg').notNull(),
  rightUpperLeg: real('right_upper_leg').notNull(),
  leftTorso: real('left_torso').notNull(),
  rightTorso: real('right_torso').notNull(),
  hip: real('hip').notNull(),
  shoulders: real('shoulder').notNull()
});
