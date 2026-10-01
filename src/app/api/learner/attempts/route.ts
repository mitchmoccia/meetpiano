import { z } from 'zod';
import { getDb } from '@/db/client';
import { UUID_PATTERN } from '@/features/family/validation';
import { attemptSummarySchema } from '@/features/progress/attempt-details';
import { saveAttempts, type SaveEntry, type SaveResult } from '@/features/progress/save';
import { recordSyncEvents } from '@/features/progress/sync-events';
import { readParentSession } from '@/lib/auth/session';
import { jsonResponse, readBody } from '@/lib/http';
import { errorName, log } from '@/lib/log';
import { consumeRateLimit, isSameOriginRequest, RATE_RULES } from '@/lib/security';

const MAX_BODY_BYTES = 64 * 1024;

const envelopeSchema = z.strictObject({
  userId: z.string().min(1).max(128),
  entries: z.array(z.strictObject({ childId: z.string().max(64), attempt: z.unknown() })).min(1).max(20)
});

type Envelope = z.infer<typeof envelopeSchema>;

function echoedId(attempt: unknown): string {
  const id = attempt && typeof attempt === 'object' && 'clientAttemptId' in attempt ? attempt.clientAttemptId : null;
  return typeof id === 'string' ? id.slice(0, 64) : '';
}

/** Saves valid entries and answers every entry in the order it was sent, so the browser can settle each one. */
async function saveEnvelope(userId: string, entries: Envelope['entries']): Promise<SaveResult[]> {
  const results: SaveResult[] = new Array(entries.length);
  const valid: { index: number; entry: SaveEntry }[] = [];
  entries.forEach((raw, index) => {
    const attempt = attemptSummarySchema.safeParse(raw.attempt);
    if (attempt.success && UUID_PATTERN.test(raw.childId)) {
      valid.push({ index, entry: { childId: raw.childId.toLowerCase(), attempt: attempt.data } });
    } else {
      results[index] = { clientAttemptId: echoedId(raw.attempt), status: 'rejected', reason: 'invalid-summary' };
    }
  });
  const invalid = results.filter(Boolean).map((result) => ({
    childId: null,
    lessonId: null,
    clientAttemptId: result.clientAttemptId || null,
    outcome: 'rejected' as const,
    reason: 'invalid-summary'
  }));
  await recordSyncEvents(getDb(), userId, invalid);
  const saved = valid.length ? await saveAttempts(getDb(), userId, valid.map((item) => item.entry), 'live') : [];
  valid.forEach((item, position) => {
    const result = saved[position];
    if (result) results[item.index] = result;
  });
  return results;
}

/**
 * Receives checkpoint summaries from the lesson page's outbox. The body names the account it was queued for; a
 * different signed-in account gets 409 so a shared browser never uploads one family's practice into another's.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    if (!isSameOriginRequest(request)) return jsonResponse({ error: 'cross-site' }, 403);
    const session = await readParentSession(request.headers);
    if (!session) return jsonResponse({ error: 'signed-out' }, 401);
    const body = await readBody(request, MAX_BODY_BYTES);
    if (!body.ok) return body.response;
    const envelope = envelopeSchema.safeParse(body.value);
    if (!envelope.success) return jsonResponse({ error: 'invalid-request' }, 400);
    if (envelope.data.userId !== session.userId) return jsonResponse({ error: 'account-mismatch' }, 409);
    if (!(await consumeRateLimit(`attempt-save:${session.userId}`, RATE_RULES.attemptSave))) {
      return jsonResponse({ error: 'rate-limited' }, 429);
    }
    return jsonResponse({ results: await saveEnvelope(session.userId, envelope.data.entries) });
  } catch (error) {
    log.error('learner.attempts_failed', { error: errorName(error) });
    return jsonResponse({ error: 'server-error' }, 500);
  }
}
