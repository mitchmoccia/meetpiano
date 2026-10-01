import 'server-only';
import { asc, eq } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { curriculumLesson, curriculumUnit } from '@/db/schema';

export type LessonSetting = {
  id: string;
  unitId: string;
  unitTitle: string;
  title: string;
  position: number;
  status: 'available' | 'paused';
  statusNote: string | null;
  currentContentVersion: string;
};

export type CatalogAvailability = { paused: string[]; order: Record<string, number> };

/** Lessons in journey order: by unit, then the display position within the unit. */
export async function readLessonSettings(db: Database): Promise<LessonSetting[]> {
  return db
    .select({
      id: curriculumLesson.id,
      unitId: curriculumLesson.unitId,
      unitTitle: curriculumUnit.title,
      title: curriculumLesson.title,
      position: curriculumLesson.position,
      status: curriculumLesson.status,
      statusNote: curriculumLesson.statusNote,
      currentContentVersion: curriculumLesson.currentContentVersion
    })
    .from(curriculumLesson)
    .innerJoin(curriculumUnit, eq(curriculumLesson.unitId, curriculumUnit.id))
    .orderBy(asc(curriculumUnit.position), asc(curriculumLesson.position), asc(curriculumLesson.id));
}

/** The availability overlay the lesson engine applies: paused lessons and display order within each unit. */
export function availabilityFrom(settings: LessonSetting[]): CatalogAvailability {
  return {
    paused: settings.filter((lesson) => lesson.status === 'paused').map((lesson) => lesson.id),
    order: Object.fromEntries(settings.map((lesson) => [lesson.id, lesson.position]))
  };
}
