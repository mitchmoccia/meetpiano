import { sql } from 'drizzle-orm';
import { check, foreignKey, index, integer, jsonb, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { createdAt, timestampTz, updatedAt } from './columns';
import { curriculumLesson, curriculumLessonVersion } from './curriculum';
import { childProfile } from './family';
import type { AttemptDetails } from '@/features/progress/attempt-details';

const PHASE_VALUES = sql.raw(
  `('explanation', 'demo', 'guided', 'independent', 'transfer', 'remediation', 'review', 'result')`
);
const EVIDENCE_VALUES = sql.raw(`('explored', 'practiced', 'independent', 'retained')`);
const INPUT_VALUES = sql.raw(`('touch', 'computer-keys', 'midi', 'mixed')`);

export const lessonAttempt = pgTable(
  'lesson_attempt',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientAttemptId: text('client_attempt_id').notNull().unique(),
    childId: uuid('child_id')
      .notNull()
      .references(() => childProfile.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id').notNull(),
    contentVersion: text('content_version').notNull(),
    source: text('source').notNull(),
    revision: integer('revision').notNull(),
    phase: text('phase').notNull(),
    furthestPhase: text('furthest_phase').notNull(),
    evidenceState: text('evidence_state'),
    inputMode: text('input_mode').notNull(),
    startedAt: timestampTz('started_at').notNull(),
    completedAt: timestampTz('completed_at'),
    firstCompletedAt: timestampTz('first_completed_at'),
    lastActivityAt: timestampTz('last_activity_at').notNull(),
    details: jsonb('details').$type<AttemptDetails>().notNull(),
    receivedAt: timestampTz('received_at').notNull().defaultNow(),
    updatedAt: updatedAt()
  },
  (table) => [
    foreignKey({
      name: 'lesson_attempt_lesson_version_fk',
      columns: [table.lessonId, table.contentVersion],
      foreignColumns: [curriculumLessonVersion.lessonId, curriculumLessonVersion.contentVersion]
    }).onDelete('restrict'),
    index('lesson_attempt_child_lesson_idx').on(table.childId, table.lessonId),
    index('lesson_attempt_child_activity_idx').on(table.childId, table.lastActivityAt),
    index('lesson_attempt_lesson_started_idx').on(table.lessonId, table.startedAt),
    check('lesson_attempt_client_id_format', sql`${table.clientAttemptId} ~ '^[A-Za-z0-9-]{8,64}$'`),
    check('lesson_attempt_source_value', sql`${table.source} in ('live', 'import')`),
    check('lesson_attempt_revision_range', sql`${table.revision} between 1 and 100000`),
    check('lesson_attempt_phase_value', sql`${table.phase} in ${PHASE_VALUES}`),
    check('lesson_attempt_furthest_phase_value', sql`${table.furthestPhase} in ${PHASE_VALUES}`),
    check('lesson_attempt_evidence_value', sql`${table.evidenceState} is null or ${table.evidenceState} in ${EVIDENCE_VALUES}`),
    check('lesson_attempt_input_value', sql`${table.inputMode} in ${INPUT_VALUES}`),
    check(
      'lesson_attempt_mastery_needs_completion',
      sql`${table.evidenceState} is null or ${table.evidenceState} not in ('independent', 'retained') or ${table.completedAt} is not null`
    ),
    check(
      'lesson_attempt_first_completion_consistent',
      sql`(${table.firstCompletedAt} is null) = (${table.completedAt} is null)`
    ),
    check('lesson_attempt_details_size', sql`octet_length(${table.details}::text) <= 2048`)
  ]
);

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    childId: uuid('child_id')
      .notNull()
      .references(() => childProfile.id, { onDelete: 'cascade' }),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => curriculumLesson.id, { onDelete: 'restrict' }),
    evidenceState: text('evidence_state'),
    attemptCount: integer('attempt_count').notNull().default(0),
    completedAttemptCount: integer('completed_attempt_count').notNull().default(0),
    importedAttemptCount: integer('imported_attempt_count').notNull().default(0),
    firstStartedAt: timestampTz('first_started_at'),
    lastActivityAt: timestampTz('last_activity_at'),
    firstCompletedAt: timestampTz('first_completed_at'),
    exploredAt: timestampTz('explored_at'),
    practicedAt: timestampTz('practiced_at'),
    independentAt: timestampTz('independent_at'),
    retainedAt: timestampTz('retained_at'),
    lastInputMode: text('last_input_mode'),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    primaryKey({ columns: [table.childId, table.lessonId] }),
    check('lesson_progress_evidence_value', sql`${table.evidenceState} is null or ${table.evidenceState} in ${EVIDENCE_VALUES}`),
    check(
      'lesson_progress_counts_valid',
      sql`${table.attemptCount} >= ${table.completedAttemptCount} and ${table.completedAttemptCount} >= 0 and ${table.importedAttemptCount} between 0 and ${table.attemptCount}`
    )
  ]
);
