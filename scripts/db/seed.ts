import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { authAccount, authUser, childProfile, family } from '@/db/schema';
import { CURRICULUM_VERSION } from '@/features/curriculum/catalog';
import { syncCurriculum } from '@/features/curriculum/sync';
import type { Avatar } from '@/features/family/validation';
import type { AttemptDetails, AttemptSummary, EvidenceState } from '@/features/progress/attempt-details';
import { saveAttempts, type SaveEntry } from '@/features/progress/save';
import { openDatabase, runScript } from './connect';

type SeedLearner = { nickname: string; avatar: Avatar | null; lessons: Array<[lessonId: string, evidence: EvidenceState]>; unfinished?: string };
type SeedFamily = { key: string; learners: SeedLearner[] };

const DOMAIN = 'seed.meetpiano.test';
const BASE_TIME = Date.parse('2026-09-14T15:00:00Z');
const LADDER: EvidenceState[] = ['explored', 'practiced', 'independent', 'retained'];

const FAMILIES: SeedFamily[] = [
  {
    key: 'river',
    learners: [
      { nickname: 'Mia', avatar: 'sun', lessons: [['L01', 'practiced'], ['L02', 'explored']], unfinished: 'L02' },
      { nickname: 'Leo', avatar: 'sky', lessons: [] }
    ]
  },
  { key: 'harbor', learners: [{ nickname: 'Ava', avatar: 'leaf', lessons: [['L01', 'independent'], ['L02', 'practiced'], ['L03', 'explored']] }] }
];

function details(evidence: EvidenceState | null): AttemptDetails {
  const quiet = evidence === 'independent' || evidence === 'retained';
  return {
    skillVersion: 'beginner-v1',
    patternId: 'home',
    tempoBpm: null,
    octavePolicy: 'pitch-class',
    assistance: { hintsUsed: !quiet, helpRequested: false, reducedTempo: false },
    adult: { posture: false, fingering: false, hand: false, listened: false, selfHeard: false, note: null },
    flags: {
      helped: false,
      hintsOn: !quiet,
      sessionCheck: false,
      reviewPaused: false,
      dynamicsPassed: false,
      finishedThrough: evidence !== null,
      notesPassed: evidence !== null,
      rhythmPassed: false,
      velocityCapable: false
    }
  };
}

function summary(id: string, lessonId: string, startedMs: number, evidence: EvidenceState | null): AttemptSummary {
  const finished = evidence !== null;
  const end = new Date(startedMs + (finished ? 6 : 3) * 60_000).toISOString();
  return {
    clientAttemptId: id,
    lessonId,
    contentVersion: CURRICULUM_VERSION,
    revision: 1,
    phase: finished ? 'result' : 'guided',
    evidenceState: evidence,
    inputMode: 'touch',
    startedAt: new Date(startedMs).toISOString(),
    completedAt: finished ? end : null,
    lastActivityAt: end,
    details: details(evidence)
  };
}

/** Fixed ids and times, so a second run reports every try as already saved instead of adding more. */
function learnerAttempts(familyKey: string, learner: SeedLearner): AttemptSummary[] {
  const prefix = `seed-${familyKey}-${learner.nickname.toLowerCase()}`;
  const attempts: AttemptSummary[] = [];
  learner.lessons.forEach(([lessonId, reached], lessonIndex) => {
    const steps = LADDER.slice(0, LADDER.indexOf(reached) + 1);
    steps.forEach((evidence, step) => {
      const startedMs = BASE_TIME + (lessonIndex * 2 + step) * 86_400_000;
      attempts.push(summary(`${prefix}-${lessonId.toLowerCase()}-${step + 1}`, lessonId, startedMs, evidence));
    });
  });
  if (learner.unfinished) attempts.push(summary(`${prefix}-${learner.unfinished.toLowerCase()}-open`, learner.unfinished, BASE_TIME + 9 * 86_400_000, null));
  return attempts;
}

async function ensureParent(db: Database, email: string, passwordHash: string): Promise<string> {
  await db.insert(authUser).values({ id: randomUUID(), email, name: '', emailVerified: true }).onConflictDoNothing({ target: authUser.email });
  const [user] = await db.select({ id: authUser.id }).from(authUser).where(eq(authUser.email, email)).limit(1);
  if (!user) throw new Error(`Seed parent ${email} could not be created.`);
  const [account] = await db
    .select({ id: authAccount.id })
    .from(authAccount)
    .where(and(eq(authAccount.userId, user.id), eq(authAccount.providerId, 'credential')))
    .limit(1);
  if (!account) await db.insert(authAccount).values({ id: randomUUID(), accountId: user.id, providerId: 'credential', userId: user.id, password: passwordHash });
  return user.id;
}

async function ensureLearner(db: Database, familyId: string, learner: SeedLearner): Promise<string> {
  await db.insert(childProfile).values({ familyId, nickname: learner.nickname, avatar: learner.avatar }).onConflictDoNothing();
  const [row] = await db
    .select({ id: childProfile.id })
    .from(childProfile)
    .where(and(eq(childProfile.familyId, familyId), eq(childProfile.nickname, learner.nickname)))
    .limit(1);
  if (!row) throw new Error(`Seed learner ${learner.nickname} could not be created.`);
  return row.id;
}

async function seedFamily(db: Database, seed: SeedFamily, passwordHash: string) {
  const userId = await ensureParent(db, `${seed.key}.family@${DOMAIN}`, passwordHash);
  await db.insert(family).values({ ownerUserId: userId }).onConflictDoNothing({ target: family.ownerUserId });
  const [familyRow] = await db.select({ id: family.id }).from(family).where(eq(family.ownerUserId, userId)).limit(1);
  if (!familyRow) throw new Error('Seed family could not be created.');
  const entries: SaveEntry[] = [];
  for (const learner of seed.learners) {
    const childId = await ensureLearner(db, familyRow.id, learner);
    entries.push(...learnerAttempts(seed.key, learner).map((attempt) => ({ childId, attempt })));
  }
  const results = entries.length ? await saveAttempts(db, userId, entries, 'live') : [];
  const count = (status: string) => results.filter((result) => result.status === status).length;
  console.info(`${seed.key}.family@${DOMAIN}: ${count('saved')} saved, ${count('unchanged')} unchanged, ${count('rejected') + count('conflict')} refused.`);
}

void runScript(async () => {
  const password = process.env.SEED_PARENT_PASSWORD ?? '';
  if (password.length < 10) throw new Error('Set SEED_PARENT_PASSWORD (10+ characters) for the synthetic parent accounts.');
  const { db, close } = await openDatabase('development');
  try {
    const curriculum = await syncCurriculum(db);
    console.info(`Curriculum: ${curriculum.lessons} lessons.`);
    const passwordHash = await hashPassword(password);
    for (const seed of FAMILIES) await seedFamily(db, seed, passwordHash);
  } finally {
    await close();
  }
});
