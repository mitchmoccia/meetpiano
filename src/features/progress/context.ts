import 'server-only';
import { cloudProgressView, type CloudAttemptRow, type CloudProgressView } from '@learn/cloud-merge.js';
import type { Database } from '@/db/client';
import { availabilityFrom, readLessonSettings, type CatalogAvailability } from '@/features/curriculum/settings';
import { findOwnedChild } from '@/features/family/service';
import type { Avatar } from '@/features/family/validation';
import { deriveStore, loadAttemptHistory, toCloudRow } from './history';

export type LearnerContext = {
  child: { id: string; nickname: string; avatar: Avatar | null };
  catalog: CatalogAvailability;
  progress: CloudProgressView & { attempts: CloudAttemptRow[] };
};

/** Everything the lesson page needs to practice as one learner, or null when the child is not in this parent's family. */
export async function learnerContext(db: Database, userId: string, childId: string): Promise<LearnerContext | null> {
  const child = await findOwnedChild(db, userId, childId);
  if (!child) return null;
  const [settings, history] = await Promise.all([readLessonSettings(db), loadAttemptHistory(db, child.id)]);
  return {
    child: { id: child.id, nickname: child.nickname, avatar: child.avatar },
    catalog: availabilityFrom(settings),
    progress: { ...cloudProgressView(deriveStore(history)), attempts: history.recent.map(toCloudRow) }
  };
}
