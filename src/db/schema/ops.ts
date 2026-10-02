import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { authUser } from './auth';
import { createdAt, timestampTz } from './columns';
import { childProfile } from './family';

/** One row per database branch, inserted by an operator. Code refuses to run against a branch whose marker does not match. */
export const databaseEnvironment = pgTable(
  'database_environment',
  {
    singleton: boolean('singleton').primaryKey().default(true),
    environment: text('environment').notNull(),
    markedAt: timestampTz('marked_at').notNull().defaultNow()
  },
  (table) => [
    check('database_environment_singleton', sql`${table.singleton}`),
    check('database_environment_value', sql`${table.environment} in ('production', 'development')`)
  ]
);

export const progressSyncEvent = pgTable(
  'progress_sync_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => authUser.id, { onDelete: 'cascade' }),
    childId: uuid('child_id').references(() => childProfile.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id'),
    clientAttemptId: text('client_attempt_id'),
    outcome: text('outcome').notNull(),
    reason: text('reason').notNull(),
    createdAt: createdAt()
  },
  (table) => [
    index('progress_sync_event_created_idx').on(table.createdAt),
    index('progress_sync_event_lesson_idx').on(table.lessonId, table.createdAt),
    check('progress_sync_event_outcome_value', sql`${table.outcome} in ('rejected', 'conflict', 'imported')`),
    check('progress_sync_event_reason_length', sql`char_length(${table.reason}) <= 80`)
  ]
);

export const appRateLimit = pgTable('app_rate_limit', {
  key: text('key').primaryKey(),
  windowStart: timestampTz('window_start').notNull(),
  count: integer('count').notNull()
});

export const devEmailCapture = pgTable(
  'dev_email_capture',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    toAddress: text('to_address').notNull(),
    subject: text('subject').notNull(),
    textBody: text('text_body').notNull(),
    createdAt: createdAt()
  },
  (table) => [index('dev_email_capture_to_idx').on(table.toAddress, table.createdAt)]
);
