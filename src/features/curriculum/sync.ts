import { sql } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { curriculumLesson, curriculumLessonVersion, curriculumUnit } from '@/db/schema';
import { catalogLessons, catalogUnits } from './catalog';

export type SyncSummary = { units: number; lessons: number; versions: number };

/**
 * Mirrors the code catalog into the database. Titles, unlock rules, and content versions follow the code; an admin's
 * pause and display order on existing lessons are kept. Safe to run repeatedly.
 */
export async function syncCurriculum(db: Database): Promise<SyncSummary> {
  const units = catalogUnits();
  const lessons = catalogLessons();
  await db.transaction(async (tx) => {
    for (const unit of units) {
      await tx
        .insert(curriculumUnit)
        .values(unit)
        .onConflictDoUpdate({ target: curriculumUnit.id, set: { title: unit.title, position: unit.position } });
    }
    for (const lesson of lessons) {
      await tx
        .insert(curriculumLesson)
        .values({
          id: lesson.id,
          unitId: lesson.unitId,
          title: lesson.title,
          position: lesson.position,
          currentContentVersion: lesson.contentVersion,
          unlocksAfter: lesson.unlocksAfter,
          unlockNeeds: lesson.unlockNeeds
        })
        .onConflictDoUpdate({
          target: curriculumLesson.id,
          set: {
            unitId: lesson.unitId,
            title: lesson.title,
            currentContentVersion: lesson.contentVersion,
            unlocksAfter: lesson.unlocksAfter,
            unlockNeeds: lesson.unlockNeeds,
            updatedAt: sql`now()`
          }
        });
      await tx
        .insert(curriculumLessonVersion)
        .values({ lessonId: lesson.id, contentVersion: lesson.contentVersion })
        .onConflictDoNothing();
    }
  });
  return { units: units.length, lessons: lessons.length, versions: lessons.length };
}
