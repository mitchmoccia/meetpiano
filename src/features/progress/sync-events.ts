import 'server-only';
import type { Database } from '@/db/client';
import { progressSyncEvent } from '@/db/schema';
import { errorName, log } from '@/lib/log';

export type SyncEventInput = {
  childId: string | null;
  lessonId: string | null;
  clientAttemptId: string | null;
  outcome: 'rejected' | 'conflict' | 'imported';
  reason: string;
};

/**
 * Keeps a diagnostic trail of saves the server refused, for the admin saving-problems view. A failure here is logged
 * and does not undo saves that already committed.
 */
export async function recordSyncEvents(db: Database, userId: string, events: SyncEventInput[]): Promise<void> {
  if (!events.length) return;
  try {
    await db.insert(progressSyncEvent).values(events.map((event) => ({ ...event, userId, reason: event.reason.slice(0, 80) })));
  } catch (error) {
    log.error('progress.sync_event_write_failed', { error: errorName(error), count: events.length });
  }
}
