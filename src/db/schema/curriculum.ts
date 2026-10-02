import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { createdAt, timestampTz, updatedAt } from './columns';

export const curriculumUnit = pgTable(
  'curriculum_unit',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    position: integer('position').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    check('curriculum_unit_id_format', sql`${table.id} ~ '^[a-z][a-z0-9-]{1,40}$'`),
    check('curriculum_unit_position_range', sql`${table.position} between 0 and 999`)
  ]
);

export const curriculumLesson = pgTable(
  'curriculum_lesson',
  {
    id: text('id').primaryKey(),
    unitId: text('unit_id')
      .notNull()
      .references(() => curriculumUnit.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    position: integer('position').notNull(),
    status: text('status').$type<'available' | 'paused'>().notNull().default('available'),
    statusNote: text('status_note'),
    currentContentVersion: text('current_content_version').notNull(),
    unlocksAfter: text('unlocks_after'),
    unlockNeeds: text('unlock_needs'),
    createdAt: createdAt(),
    updatedAt: updatedAt()
  },
  (table) => [
    index('curriculum_lesson_unit_idx').on(table.unitId, table.position),
    check('curriculum_lesson_id_format', sql`${table.id} ~ '^L[0-9]{2}$'`),
    check('curriculum_lesson_status_value', sql`${table.status} in ('available', 'paused')`),
    check('curriculum_lesson_position_range', sql`${table.position} between 0 and 999`),
    check('curriculum_lesson_status_note_length', sql`char_length(${table.statusNote}) <= 200`)
  ]
);

export const curriculumLessonVersion = pgTable(
  'curriculum_lesson_version',
  {
    lessonId: text('lesson_id')
      .notNull()
      .references(() => curriculumLesson.id, { onDelete: 'restrict' }),
    contentVersion: text('content_version').notNull(),
    createdAt: createdAt(),
    retiredAt: timestampTz('retired_at')
  },
  (table) => [
    primaryKey({ columns: [table.lessonId, table.contentVersion] }),
    check('curriculum_lesson_version_format', sql`${table.contentVersion} ~ '^[a-z0-9][a-z0-9.-]{0,39}$'`)
  ]
);
