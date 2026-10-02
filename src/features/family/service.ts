import 'server-only';
import { and, asc, count, eq, inArray, sql } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { pgErrorCode, UNIQUE_VIOLATION } from '@/db/errors';
import { childProfile, family } from '@/db/schema';
import { isAvatar, MAX_CHILDREN, UUID_PATTERN, type Avatar, type ChildInput } from './validation';

export type ChildSummary = { id: string; nickname: string; avatar: Avatar | null; createdAt: Date };
export type ChildWriteResult = { ok: true; child: ChildSummary } | { ok: false; error: string };

const childColumns = {
  id: childProfile.id,
  nickname: childProfile.nickname,
  avatar: childProfile.avatar,
  createdAt: childProfile.createdAt
};

function toSummary(row: { id: string; nickname: string; avatar: string | null; createdAt: Date }): ChildSummary {
  return { ...row, avatar: isAvatar(row.avatar) ? row.avatar : null };
}

const DUPLICATE_NICKNAME = 'Another learner in this family already uses that nickname.';

export async function findFamilyId(db: Database, userId: string): Promise<string | null> {
  const [row] = await db.select({ id: family.id }).from(family).where(eq(family.ownerUserId, userId)).limit(1);
  return row?.id ?? null;
}

export async function ensureFamily(db: Database, userId: string): Promise<string> {
  await db.insert(family).values({ ownerUserId: userId }).onConflictDoNothing({ target: family.ownerUserId });
  const id = await findFamilyId(db, userId);
  if (!id) throw new Error('Family record could not be created.');
  return id;
}

export async function listChildren(db: Database, userId: string): Promise<ChildSummary[]> {
  const rows = await db
    .select(childColumns)
    .from(childProfile)
    .innerJoin(family, eq(childProfile.familyId, family.id))
    .where(eq(family.ownerUserId, userId))
    .orderBy(asc(childProfile.createdAt));
  return rows.map(toSummary);
}

/** Turns a child id from a request into a child only when it belongs to the signed-in parent's family. */
export async function findOwnedChild(db: Database, userId: string, childId: string): Promise<ChildSummary | null> {
  if (!UUID_PATTERN.test(childId)) return null;
  const [row] = await db
    .select(childColumns)
    .from(childProfile)
    .innerJoin(family, eq(childProfile.familyId, family.id))
    .where(and(eq(childProfile.id, childId), eq(family.ownerUserId, userId)))
    .limit(1);
  return row ? toSummary(row) : null;
}

export async function ownedChildIds(db: Database, userId: string, childIds: string[]): Promise<Set<string>> {
  const candidates = [...new Set(childIds.filter((id) => UUID_PATTERN.test(id)))];
  if (!candidates.length) return new Set();
  const rows = await db
    .select({ id: childProfile.id })
    .from(childProfile)
    .innerJoin(family, eq(childProfile.familyId, family.id))
    .where(and(inArray(childProfile.id, candidates), eq(family.ownerUserId, userId)));
  return new Set(rows.map((row) => row.id));
}

export async function createChild(db: Database, userId: string, input: ChildInput): Promise<ChildWriteResult> {
  const familyId = await ensureFamily(db, userId);
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select id from family where id = ${familyId} for update`);
      const [existing] = await tx.select({ value: count() }).from(childProfile).where(eq(childProfile.familyId, familyId));
      if ((existing?.value ?? 0) >= MAX_CHILDREN) {
        return { ok: false, error: `A family can have up to ${MAX_CHILDREN} learners.` } as const;
      }
      const [row] = await tx.insert(childProfile).values({ familyId, ...input }).returning(childColumns);
      if (!row) throw new Error('Learner insert returned no row.');
      return { ok: true, child: toSummary(row) } as const;
    });
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) return { ok: false, error: DUPLICATE_NICKNAME };
    throw error;
  }
}

function ownedBy(userId: string) {
  return inArray(childProfile.familyId, sql`(select ${family.id} from ${family} where ${family.ownerUserId} = ${userId})`);
}

export async function updateChild(db: Database, userId: string, childId: string, input: ChildInput): Promise<ChildWriteResult> {
  if (!UUID_PATTERN.test(childId)) return { ok: false, error: 'That learner was not found.' };
  try {
    const [row] = await db
      .update(childProfile)
      .set(input)
      .where(and(eq(childProfile.id, childId), ownedBy(userId)))
      .returning(childColumns);
    return row ? { ok: true, child: toSummary(row) } : { ok: false, error: 'That learner was not found.' };
  } catch (error) {
    if (pgErrorCode(error) === UNIQUE_VIOLATION) return { ok: false, error: DUPLICATE_NICKNAME };
    throw error;
  }
}

/** Deletes a learner and, through cascading keys, every attempt and progress row recorded for them. */
export async function deleteChild(db: Database, userId: string, childId: string): Promise<boolean> {
  if (!UUID_PATTERN.test(childId)) return false;
  const rows = await db
    .delete(childProfile)
    .where(and(eq(childProfile.id, childId), ownedBy(userId)))
    .returning({ id: childProfile.id });
  return rows.length === 1;
}
