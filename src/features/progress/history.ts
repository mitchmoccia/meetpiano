import 'server-only';
import { deriveStoreFromAttempts, type CloudAttemptRow } from '@learn/cloud-merge.js';
import type { LearnerStore } from '@learn/progress.js';
import { and, desc, eq, isNotNull, lte, sql } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { lessonAttempt } from '@/db/schema';
import { log } from '@/lib/log';

const COMPLETED_LIMIT = 2000;
const RECENT_PER_LESSON = 6;

const historyColumns = {
  clientAttemptId: lessonAttempt.clientAttemptId,
  lessonId: lessonAttempt.lessonId,
  contentVersion: lessonAttempt.contentVersion,
  source: lessonAttempt.source,
  phase: lessonAttempt.phase,
  evidenceState: lessonAttempt.evidenceState,
  inputMode: lessonAttempt.inputMode,
  startedAt: lessonAttempt.startedAt,
  completedAt: lessonAttempt.completedAt,
  firstCompletedAt: lessonAttempt.firstCompletedAt,
  lastActivityAt: lessonAttempt.lastActivityAt,
  details: lessonAttempt.details
};

export type HistoryRow = {
  clientAttemptId: string;
  lessonId: string;
  contentVersion: string;
  source: 'live' | 'import';
  phase: string;
  evidenceState: CloudAttemptRow['evidenceState'];
  inputMode: string;
  startedAt: Date;
  completedAt: Date | null;
  firstCompletedAt: Date | null;
  lastActivityAt: Date;
  details: unknown;
};

/** Completed attempts drive the evidence replay; the few most recent tries per lesson fill activity lists. */
export type AttemptHistory = { completed: HistoryRow[]; recent: HistoryRow[] };

export async function loadAttemptHistory(db: Database, childId: string): Promise<AttemptHistory> {
  const position = sql<number>`row_number() over (partition by ${lessonAttempt.lessonId} order by ${lessonAttempt.startedAt} desc)`;
  const ranked = db
    .select({ ...historyColumns, position: position.as('position') })
    .from(lessonAttempt)
    .where(eq(lessonAttempt.childId, childId))
    .as('ranked');
  const [completed, recentRows] = await Promise.all([
    db
      .select(historyColumns)
      .from(lessonAttempt)
      .where(and(eq(lessonAttempt.childId, childId), isNotNull(lessonAttempt.completedAt)))
      .orderBy(desc(lessonAttempt.completedAt))
      .limit(COMPLETED_LIMIT),
    db.select().from(ranked).where(lte(ranked.position, RECENT_PER_LESSON))
  ]);
  if (completed.length === COMPLETED_LIMIT) log.warn('progress.history_truncated', { childId, limit: COMPLETED_LIMIT });
  return { completed, recent: recentRows };
}

export function toCloudRow(row: HistoryRow): CloudAttemptRow {
  return {
    clientAttemptId: row.clientAttemptId,
    lessonId: row.lessonId,
    contentVersion: row.contentVersion,
    phase: row.phase,
    evidenceState: row.evidenceState,
    inputMode: row.inputMode,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    firstCompletedAt: row.firstCompletedAt?.toISOString() ?? null,
    details: row.details
  };
}

/** Rebuilds the engine's view of a learner from stored attempts, using the same lane rules as the lesson player. */
export function deriveStore(history: AttemptHistory): LearnerStore {
  const rows = new Map<string, HistoryRow>();
  for (const row of [...history.completed, ...history.recent]) rows.set(row.clientAttemptId, row);
  return deriveStoreFromAttempts([...rows.values()].map(toCloudRow));
}
