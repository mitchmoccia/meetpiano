import 'server-only';
import { asc, eq } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { curriculumLesson } from '@/db/schema';
import { writeAudit, type AuditEntry } from './audit';

type Actor = AuditEntry['actor'];
export type LessonStatus = 'available' | 'paused';
export type CurriculumChange = { ok: true; changed: boolean } | { ok: false; error: 'unknown-lesson' };

/** Pauses or reopens one lesson for family learners. The lesson content itself stays in code. */
export async function setLessonStatus(db: Database, actor: Actor, lessonId: string, status: LessonStatus, note: string | null) {
  return db.transaction(async (tx): Promise<CurriculumChange> => {
    const [lesson] = await tx
      .select({ status: curriculumLesson.status, statusNote: curriculumLesson.statusNote })
      .from(curriculumLesson)
      .where(eq(curriculumLesson.id, lessonId))
      .for('update')
      .limit(1);
    if (!lesson) return { ok: false, error: 'unknown-lesson' };
    if (lesson.status === status && lesson.statusNote === note) return { ok: true, changed: false };
    await tx.update(curriculumLesson).set({ status, statusNote: note }).where(eq(curriculumLesson.id, lessonId));
    await writeAudit(tx, {
      actor,
      action: 'lesson.status_changed',
      targetType: 'lesson',
      targetId: lessonId,
      details: { from: lesson.status, to: status, note }
    });
    return { ok: true, changed: true };
  });
}

/** Swaps a lesson with its neighbour inside its unit and renumbers the unit 0..n-1. Unlock rules are unchanged. */
export async function moveLesson(db: Database, actor: Actor, lessonId: string, direction: 'up' | 'down') {
  return db.transaction(async (tx): Promise<CurriculumChange> => {
    const [target] = await tx.select({ unitId: curriculumLesson.unitId }).from(curriculumLesson).where(eq(curriculumLesson.id, lessonId)).limit(1);
    if (!target) return { ok: false, error: 'unknown-lesson' };
    const siblings = await tx
      .select({ id: curriculumLesson.id, position: curriculumLesson.position })
      .from(curriculumLesson)
      .where(eq(curriculumLesson.unitId, target.unitId))
      .orderBy(asc(curriculumLesson.position), asc(curriculumLesson.id))
      .for('update');
    const from = siblings.findIndex((row) => row.id === lessonId);
    const to = direction === 'up' ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= siblings.length) return { ok: true, changed: false };
    const order = siblings.map((row) => row.id);
    order.splice(to, 0, ...order.splice(from, 1));
    for (const [position, id] of order.entries()) {
      if (siblings[position]?.id === id && siblings[position]?.position === position) continue;
      await tx.update(curriculumLesson).set({ position }).where(eq(curriculumLesson.id, id));
    }
    await writeAudit(tx, {
      actor,
      action: 'lesson.moved',
      targetType: 'lesson',
      targetId: lessonId,
      details: { unitId: target.unitId, from, to }
    });
    return { ok: true, changed: true };
  });
}
