import { cookies } from 'next/headers';
import { getDb } from '@/db/client';
import { LEARNER_COOKIE } from '@/features/learner/cookie';
import { learnerContext } from '@/features/progress/context';
import { readParentSession } from '@/lib/auth/session';
import { jsonResponse } from '@/lib/http';
import { errorName, log } from '@/lib/log';

/** The learner the lesson page should practice as, re-checked against the signed-in parent's family on every load. */
export async function GET(request: Request): Promise<Response> {
  try {
    const session = await readParentSession(request.headers);
    if (!session) return jsonResponse({ status: 'signed-out' }, 401);
    const childId = (await cookies()).get(LEARNER_COOKIE)?.value?.toLowerCase();
    const context = childId ? await learnerContext(getDb(), session.userId, childId) : null;
    if (!context) return jsonResponse({ status: 'choose' });
    return jsonResponse({ status: 'ready', userId: session.userId, ...context });
  } catch (error) {
    log.error('learner.context_failed', { error: errorName(error) });
    return jsonResponse({ status: 'error' }, 500);
  }
}
