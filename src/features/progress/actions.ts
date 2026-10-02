'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/db/client';
import { findOwnedChild } from '@/features/family/service';
import { readParentSession } from '@/lib/auth/session';
import { TOO_MANY_ATTEMPTS } from '@/lib/forms';
import { consumeRateLimit, RATE_RULES } from '@/lib/security';
import { guestBatchSchema, importGuestAttempts, type ImportReport } from './import';

export type ImportResult = { ok: true; report: ImportReport } | { ok: false; message: string };

/**
 * Imports one batch of this browser's guest attempts into a learner the parent picked and confirmed. The child id
 * arrives from the browser, so it is resolved inside the signed-in parent's family before anything is written.
 */
export async function importGuestPracticeAction(childId: unknown, attempts: unknown, confirmed: unknown): Promise<ImportResult> {
  const session = await readParentSession();
  if (!session) return { ok: false, message: 'Your sign-in ended. Sign in again to import.' };
  if (confirmed !== true) return { ok: false, message: 'Confirm who did this practice first.' };
  const child = typeof childId === 'string' ? await findOwnedChild(getDb(), session.userId, childId) : null;
  if (!child) return { ok: false, message: 'That learner was not found.' };
  const batch = guestBatchSchema.safeParse(attempts);
  if (!batch.success) return { ok: false, message: 'There were no guest tries to import.' };
  if (!(await consumeRateLimit(`guest-import:${session.userId}`, RATE_RULES.legacyImport))) {
    return { ok: false, message: TOO_MANY_ATTEMPTS };
  }
  const report = await importGuestAttempts(getDb(), session.userId, child.id, batch.data);
  revalidatePath(`/family/children/${child.id}`);
  return { ok: true, report };
}
