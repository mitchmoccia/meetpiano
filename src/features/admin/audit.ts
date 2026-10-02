import 'server-only';
import { desc } from 'drizzle-orm';
import type { Database, Executor } from '@/db/client';
import { adminAuditLog } from '@/db/schema';
import type { ParentSession } from '@/lib/auth/session';

export type AuditDetails = Record<string, string | number | boolean | null>;

export type AuditEntry = {
  actor: Pick<ParentSession, 'userId' | 'email'>;
  action: string;
  targetType: 'lesson' | 'family' | 'admin';
  targetId: string;
  details?: AuditDetails;
};

/** Written in the same transaction as the change it records, so a change never lands without its audit row. */
export async function writeAudit(executor: Executor, entry: AuditEntry): Promise<void> {
  await executor.insert(adminAuditLog).values({
    actorUserId: entry.actor.userId,
    actorLabel: entry.actor.email,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    details: entry.details ?? {}
  });
}

export async function recentAudit(db: Database, limit = 100) {
  return db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(limit);
}
