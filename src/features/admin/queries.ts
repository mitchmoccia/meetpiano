import 'server-only';
import { and, asc, desc, eq, gt, inArray, ne, sql } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { authUser, childProfile, curriculumLesson, family, lessonAttempt, lessonProgress, progressSyncEvent } from '@/db/schema';
import { UUID_PATTERN } from '@/features/family/validation';

const since = (days: number) => sql`now() - make_interval(days => ${days})`;

export async function adminOverview(db: Database) {
  const count = sql<number>`count(*)::int`;
  const [[families], [learners], [attempts], [problems], [paused]] = await Promise.all([
    db.select({ value: count }).from(family),
    db.select({ value: count }).from(childProfile),
    db
      .select({ started: count, completed: sql<number>`count(${lessonAttempt.completedAt})::int` })
      .from(lessonAttempt)
      .where(gt(lessonAttempt.lastActivityAt, since(7))),
    db
      .select({ value: count })
      .from(progressSyncEvent)
      .where(and(ne(progressSyncEvent.outcome, 'imported'), gt(progressSyncEvent.createdAt, since(7)))),
    db.select({ value: count }).from(curriculumLesson).where(eq(curriculumLesson.status, 'paused'))
  ]);
  return {
    families: families?.value ?? 0,
    learners: learners?.value ?? 0,
    attemptsThisWeek: attempts?.started ?? 0,
    completedThisWeek: attempts?.completed ?? 0,
    problemsThisWeek: problems?.value ?? 0,
    pausedLessons: paused?.value ?? 0
  };
}

/** Per-lesson tries and save problems over the last 30 days, for spotting a lesson that is failing to save. */
export async function lessonActivity(db: Database) {
  const [tries, problems] = await Promise.all([
    db
      .select({
        lessonId: lessonAttempt.lessonId,
        started: sql<number>`count(*)::int`,
        completed: sql<number>`count(${lessonAttempt.completedAt})::int`,
        learners: sql<number>`count(distinct ${lessonAttempt.childId})::int`
      })
      .from(lessonAttempt)
      .where(gt(lessonAttempt.lastActivityAt, since(30)))
      .groupBy(lessonAttempt.lessonId),
    db
      .select({ lessonId: progressSyncEvent.lessonId, problems: sql<number>`count(*)::int` })
      .from(progressSyncEvent)
      .where(and(ne(progressSyncEvent.outcome, 'imported'), gt(progressSyncEvent.createdAt, since(30))))
      .groupBy(progressSyncEvent.lessonId)
  ]);
  return {
    tries: new Map(tries.map((row) => [row.lessonId, row])),
    problems: new Map(problems.map((row) => [row.lessonId ?? 'unknown', row.problems]))
  };
}

const syncEventColumns = {
  id: progressSyncEvent.id,
  createdAt: progressSyncEvent.createdAt,
  outcome: progressSyncEvent.outcome,
  reason: progressSyncEvent.reason,
  lessonId: progressSyncEvent.lessonId,
  clientAttemptId: progressSyncEvent.clientAttemptId,
  childId: progressSyncEvent.childId
};

export async function recentSyncEvents(db: Database, limit = 100) {
  return db
    .select({ ...syncEventColumns, familyId: family.id })
    .from(progressSyncEvent)
    .leftJoin(family, eq(family.ownerUserId, progressSyncEvent.userId))
    .orderBy(desc(progressSyncEvent.createdAt))
    .limit(limit);
}

export async function familyList(db: Database) {
  const lastActivity = sql`(select max(a.last_activity_at) from lesson_attempt a join child_profile c on c.id = a.child_id where c.family_id = ${family.id})`;
  return db
    .select({
      id: family.id,
      createdAt: family.createdAt,
      email: authUser.email,
      emailVerified: authUser.emailVerified,
      learners: sql<number>`(select count(*)::int from child_profile c where c.family_id = ${family.id})`,
      lastActivityAt: lastActivity.mapWith(lessonAttempt.lastActivityAt)
    })
    .from(family)
    .innerJoin(authUser, eq(authUser.id, family.ownerUserId))
    .orderBy(desc(family.createdAt))
    .limit(200);
}

async function learnerAttempts(db: Database, childIds: string[]) {
  if (!childIds.length) return [];
  const position = sql<number>`row_number() over (partition by ${lessonAttempt.childId} order by ${lessonAttempt.lastActivityAt} desc)`;
  const ranked = db
    .select({
      clientAttemptId: lessonAttempt.clientAttemptId,
      childId: lessonAttempt.childId,
      lessonId: lessonAttempt.lessonId,
      contentVersion: lessonAttempt.contentVersion,
      source: lessonAttempt.source,
      revision: lessonAttempt.revision,
      phase: lessonAttempt.phase,
      evidenceState: lessonAttempt.evidenceState,
      inputMode: lessonAttempt.inputMode,
      completedAt: lessonAttempt.completedAt,
      lastActivityAt: lessonAttempt.lastActivityAt,
      receivedAt: lessonAttempt.receivedAt,
      position: position.as('position')
    })
    .from(lessonAttempt)
    .where(inArray(lessonAttempt.childId, childIds))
    .as('ranked');
  return db.select().from(ranked).where(sql`${ranked.position} <= 10`).orderBy(desc(ranked.lastActivityAt));
}

/** One family for support: learners, their progress rows, latest tries, and save problems. No editing. */
export async function familyDetail(db: Database, familyId: string) {
  if (!UUID_PATTERN.test(familyId)) return null;
  const [owner] = await db
    .select({ id: family.id, createdAt: family.createdAt, userId: authUser.id, email: authUser.email, emailVerified: authUser.emailVerified })
    .from(family)
    .innerJoin(authUser, eq(authUser.id, family.ownerUserId))
    .where(eq(family.id, familyId))
    .limit(1);
  if (!owner) return null;
  const learners = await db
    .select({ id: childProfile.id, nickname: childProfile.nickname, createdAt: childProfile.createdAt })
    .from(childProfile)
    .where(eq(childProfile.familyId, familyId))
    .orderBy(asc(childProfile.createdAt));
  const ids = learners.map((learner) => learner.id);
  const [progress, attempts, events] = await Promise.all([
    ids.length ? db.select().from(lessonProgress).where(inArray(lessonProgress.childId, ids)).orderBy(asc(lessonProgress.lessonId)) : [],
    learnerAttempts(db, ids),
    db.select(syncEventColumns).from(progressSyncEvent).where(eq(progressSyncEvent.userId, owner.userId)).orderBy(desc(progressSyncEvent.createdAt)).limit(50)
  ]);
  return {
    owner,
    learners: learners.map((learner) => ({
      ...learner,
      progress: progress.filter((row) => row.childId === learner.id),
      attempts: attempts.filter((row) => row.childId === learner.id)
    })),
    events
  };
}

export type FamilyDetail = NonNullable<Awaited<ReturnType<typeof familyDetail>>>;
