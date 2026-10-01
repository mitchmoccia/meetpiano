import { sql } from 'drizzle-orm';
import { check, index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { authUser } from './auth';
import { createdAt, timestampTz } from './columns';

export const adminOperator = pgTable(
  'admin_operator',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    grantedBy: text('granted_by').notNull(),
    note: text('note'),
    grantedAt: timestampTz('granted_at').notNull().defaultNow()
  },
  (table) => [check('admin_operator_note_length', sql`char_length(${table.note}) <= 200`)]
);

export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: text('actor_user_id').references(() => authUser.id, { onDelete: 'set null' }),
    actorLabel: text('actor_label').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    details: jsonb('details').$type<Record<string, string | number | boolean | null>>().notNull().default({}),
    createdAt: createdAt()
  },
  (table) => [
    index('admin_audit_log_created_idx').on(table.createdAt),
    index('admin_audit_log_target_idx').on(table.targetType, table.targetId),
    check('admin_audit_log_details_size', sql`octet_length(${table.details}::text) <= 4096`)
  ]
);
