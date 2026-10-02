import { sql } from 'drizzle-orm';
import { check, index, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { authUser } from './auth';
import { createdAt, updatedAt } from './columns';

export const family = pgTable('family', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: text('owner_user_id')
    .notNull()
    .unique()
    .references(() => authUser.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});

export const childProfile = pgTable(
  'child_profile',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => family.id, { onDelete: 'cascade' }),
    nickname: text('nickname').notNull(),
    avatar: text('avatar'),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    index('child_profile_family_idx').on(table.familyId),
    uniqueIndex('child_profile_family_nickname_uidx').on(table.familyId, sql`lower(${table.nickname})`),
    check('child_profile_nickname_length', sql`char_length(${table.nickname}) between 1 and 24`),
    check(
      'child_profile_avatar_preset',
      sql`${table.avatar} is null or ${table.avatar} in ('sun', 'berry', 'ember', 'sky', 'leaf', 'plum')`
    )
  ]
);
