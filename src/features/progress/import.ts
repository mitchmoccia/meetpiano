import 'server-only';
import { z } from 'zod';
import type { Database } from '@/db/client';
import { attemptSummarySchema, type AttemptSummary } from './attempt-details';
import { saveAttempts } from './save';
import { recordSyncEvents } from './sync-events';

export const IMPORT_BATCH_SIZE = 100;

export const guestBatchSchema = z.array(z.unknown()).min(1).max(IMPORT_BATCH_SIZE);

/** Guest attempts arrive as first revisions; each keeps the evidence the lesson player recorded and nothing more. */
const guestAttemptSchema = attemptSummarySchema.extend({ revision: z.literal(1) });

export type ImportReport = { saved: number; alreadySaved: number; otherLearner: number; rejected: number };

/** Copies guest attempts into one learner's profile. Re-running it is safe: matching attempts report as already saved. */
export async function importGuestAttempts(db: Database, userId: string, childId: string, items: unknown[]): Promise<ImportReport> {
  const valid: AttemptSummary[] = [];
  for (const item of items) {
    const parsed = guestAttemptSchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
  }
  const results = valid.length ? await saveAttempts(db, userId, valid.map((attempt) => ({ childId, attempt })), 'import') : [];
  const count = (status: string) => results.filter((result) => result.status === status).length;
  const report = {
    saved: count('saved'),
    alreadySaved: count('unchanged'),
    otherLearner: count('conflict'),
    rejected: count('rejected') + items.length - valid.length
  };
  await recordSyncEvents(db, userId, [
    {
      childId,
      lessonId: null,
      clientAttemptId: null,
      outcome: 'imported',
      reason: `saved ${report.saved}, already ${report.alreadySaved}, other ${report.otherLearner}, rejected ${report.rejected}`
    }
  ]);
  return report;
}
