import 'server-only';
import { asc, eq, inArray } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { authSession, authUser, family, lessonAttempt, lessonProgress } from '@/db/schema';
import { listChildren } from './service';

/** Everything MeetPiano stores for one parent account, as a downloadable JSON document. */
export async function familyExport(db: Database, userId: string) {
  const [account] = await db
    .select({ email: authUser.email, emailVerified: authUser.emailVerified, createdAt: authUser.createdAt })
    .from(authUser)
    .where(eq(authUser.id, userId))
    .limit(1);
  const sessions = await db
    .select({ createdAt: authSession.createdAt, expiresAt: authSession.expiresAt, ipAddress: authSession.ipAddress, userAgent: authSession.userAgent })
    .from(authSession)
    .where(eq(authSession.userId, userId))
    .orderBy(asc(authSession.createdAt));
  const [familyRow] = await db.select({ createdAt: family.createdAt }).from(family).where(eq(family.ownerUserId, userId)).limit(1);
  const children = await listChildren(db, userId);
  const ids = children.map((child) => child.id);
  const [progress, attempts] = ids.length
    ? await Promise.all([
        db.select().from(lessonProgress).where(inArray(lessonProgress.childId, ids)).orderBy(asc(lessonProgress.lessonId)),
        db.select().from(lessonAttempt).where(inArray(lessonAttempt.childId, ids)).orderBy(asc(lessonAttempt.startedAt))
      ])
    : [[], []];
  return {
    exportedAt: new Date().toISOString(),
    account: account ?? null,
    signInSessions: sessions,
    family: familyRow ?? null,
    learners: children.map((child) => ({
      nickname: child.nickname,
      avatar: child.avatar,
      createdAt: child.createdAt,
      lessonProgress: progress.filter((row) => row.childId === child.id).map(({ childId: _childId, ...row }) => row),
      attempts: attempts
        .filter((row) => row.childId === child.id)
        .map(({ id: _id, childId: _childId, ...row }) => row)
    }))
  };
}
