import 'server-only';
import { eq, inArray, sql } from 'drizzle-orm';
import type { Database, Transaction } from '@/db/client';
import { pgErrorCode, UNIQUE_VIOLATION } from '@/db/errors';
import { curriculumLessonVersion, lessonAttempt } from '@/db/schema';
import { ownedChildIds } from '@/features/family/service';
import { recomputeLessonProgress } from './aggregate';
import type { AttemptSource, AttemptSummary } from './attempt-details';
import { summaryBoundsProblem } from './bounds';
import { attemptFromSummary, mergeAttempt, type AttemptRecord } from './merge';
import { recordSyncEvents, type SyncEventInput } from './sync-events';

export type SaveEntry = { childId: string; attempt: AttemptSummary };
export type SaveStatus = 'saved' | 'unchanged' | 'rejected' | 'conflict';
export type SaveResult = { clientAttemptId: string; status: SaveStatus; revision?: number; reason?: string };

type SaveContext = { owned: Set<string>; versions: Set<string>; now: number; source: AttemptSource };

const versionKey = (lessonId: string, contentVersion: string) => `${lessonId}@${contentVersion}`;

async function knownVersions(db: Database, lessonIds: string[]): Promise<Set<string>> {
  const ids = [...new Set(lessonIds)];
  if (!ids.length) return new Set();
  const rows = await db
    .select({ lessonId: curriculumLessonVersion.lessonId, contentVersion: curriculumLessonVersion.contentVersion })
    .from(curriculumLessonVersion)
    .where(inArray(curriculumLessonVersion.lessonId, ids));
  return new Set(rows.map((row) => versionKey(row.lessonId, row.contentVersion)));
}

function recordFromRow(row: typeof lessonAttempt.$inferSelect): AttemptRecord {
  return {
    childId: row.childId,
    lessonId: row.lessonId,
    contentVersion: row.contentVersion,
    source: row.source,
    revision: row.revision,
    phase: row.phase,
    furthestPhase: row.furthestPhase,
    evidenceState: row.evidenceState,
    inputMode: row.inputMode,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    firstCompletedAt: row.firstCompletedAt,
    lastActivityAt: row.lastActivityAt,
    details: row.details
  };
}

/** Serializes writers for one learner and lesson so the attempt row and its aggregate change together. */
async function writeAttempt(tx: Transaction, clientAttemptId: string, incoming: AttemptRecord): Promise<SaveResult> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${incoming.childId}:${incoming.lessonId}`}, 0))`);
  const [row] = await tx.select().from(lessonAttempt).where(eq(lessonAttempt.clientAttemptId, clientAttemptId)).for('update').limit(1);
  if (!row) {
    await tx.insert(lessonAttempt).values({ clientAttemptId, ...incoming });
    await recomputeLessonProgress(tx, incoming.childId, incoming.lessonId);
    return { clientAttemptId, status: 'saved', revision: incoming.revision };
  }
  const outcome = mergeAttempt(recordFromRow(row), incoming);
  if (outcome.kind === 'conflict') return { clientAttemptId, status: 'conflict', reason: outcome.reason };
  if (outcome.kind === 'unchanged') return { clientAttemptId, status: 'unchanged', revision: row.revision };
  await tx.update(lessonAttempt).set(outcome.record).where(eq(lessonAttempt.id, row.id));
  await recomputeLessonProgress(tx, incoming.childId, incoming.lessonId);
  return { clientAttemptId, status: 'saved', revision: outcome.record.revision };
}

async function saveOne(db: Database, entry: SaveEntry, context: SaveContext): Promise<SaveResult> {
  const { attempt } = entry;
  const clientAttemptId = attempt.clientAttemptId;
  if (!context.owned.has(entry.childId)) return { clientAttemptId, status: 'rejected', reason: 'unknown-learner' };
  if (!context.versions.has(versionKey(attempt.lessonId, attempt.contentVersion))) {
    return { clientAttemptId, status: 'rejected', reason: 'unknown-lesson-version' };
  }
  const problem = summaryBoundsProblem(attempt, context.now);
  if (problem) return { clientAttemptId, status: 'rejected', reason: problem };
  const incoming = attemptFromSummary(entry.childId, attempt, context.source);
  try {
    return await db.transaction((tx) => writeAttempt(tx, clientAttemptId, incoming));
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) return { clientAttemptId, status: 'conflict', reason: 'duplicate-attempt-id' };
    throw error;
  }
}

function syncEvent(entry: SaveEntry, result: SaveResult, owned: Set<string>): SyncEventInput {
  return {
    childId: owned.has(entry.childId) ? entry.childId : null,
    lessonId: entry.attempt.lessonId,
    clientAttemptId: result.clientAttemptId,
    outcome: result.status === 'conflict' ? 'conflict' : 'rejected',
    reason: result.reason ?? result.status
  };
}

/**
 * Stores attempt summaries for learners in the signed-in parent's family. Child ids come from the request, so each
 * one is checked against the parent's family; each entry commits on its own, so a retried batch is safe to replay.
 * Results come back in entry order.
 */
export async function saveAttempts(db: Database, userId: string, entries: SaveEntry[], source: AttemptSource): Promise<SaveResult[]> {
  const owned = await ownedChildIds(db, userId, entries.map((entry) => entry.childId));
  const versions = await knownVersions(db, entries.map((entry) => entry.attempt.lessonId));
  const context: SaveContext = { owned, versions, now: Date.now(), source };
  const results: SaveResult[] = [];
  const events: SyncEventInput[] = [];
  for (const entry of entries) {
    const result = await saveOne(db, entry, context);
    results.push(result);
    if (result.status === 'rejected' || result.status === 'conflict') events.push(syncEvent(entry, result, owned));
  }
  await recordSyncEvents(db, userId, events);
  return results;
}
