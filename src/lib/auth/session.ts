import 'server-only';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { assertDatabaseEnvironment, getDb } from '@/db/client';
import { authAccount } from '@/db/schema';
import { enforceRateLimit, RATE_RULES } from '@/lib/security';
import { getAuth } from './server';

export type ParentSession = {
  userId: string;
  email: string;
  name: string;
  sessionId: string;
  expiresAt: Date;
};

/** Returns the verified parent for this request, or null. Every protected page, action, and route calls this on the server. */
export async function readParentSession(requestHeaders?: Headers): Promise<ParentSession | null> {
  await assertDatabaseEnvironment();
  const result = await getAuth().api.getSession({ headers: requestHeaders ?? (await headers()) });
  if (!result || !result.user.emailVerified) return null;
  return {
    userId: result.user.id,
    email: result.user.email,
    name: result.user.name,
    sessionId: result.session.id,
    expiresAt: result.session.expiresAt
  };
}

/** The verified parent for the current page render or server action, read once per request. */
export const currentParent = cache((): Promise<ParentSession | null> => readParentSession());

export async function requireParent(returnPath: string): Promise<ParentSession> {
  const session = await currentParent();
  if (!session) redirect(`/signin?next=${encodeURIComponent(returnPath)}`);
  return session;
}

/** Fresh re-authentication for destructive actions: the parent re-enters the account password. */
export async function verifyParentPassword(userId: string, password: string): Promise<boolean> {
  if (!password || password.length > 128) return false;
  await enforceRateLimit(`password-check:${userId}`, RATE_RULES.passwordCheck);
  const [account] = await getDb()
    .select({ hash: authAccount.password })
    .from(authAccount)
    .where(and(eq(authAccount.userId, userId), eq(authAccount.providerId, 'credential')))
    .limit(1);
  if (!account?.hash) return false;
  const context = await getAuth().$context;
  return context.password.verify({ hash: account.hash, password });
}
