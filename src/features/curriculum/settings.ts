import 'server-only';
import { asc } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { curriculumLesson } from '@/db/schema';

export type LessonSetting = {
  id: string;
  unitId: string;
  title: string;
  position: number;
  status: 'available' | 'paused';
  statusNote: string | null;
  currentContentVersion: string;
};

export type CatalogAvailability = { paused: string[]; order: Record<string, number> };

export async function readLessonSettings(db: Database): Promise<LessonSetting[]> {
  const rows = await db
    .select()
    .from(curriculumLesson)
    .orderBy(asc(curriculumLesson.unitId), asc(curriculumLesson.position), asc(curriculumLesson.id));
  return rows.map((row) => ({
    id: row.id,
    unitId: row.unitId,
    title: row.title,
    position: row.position,
    status: row.status === 'paused' ? 'paused' : 'available',
    statusNote: row.statusNote,
    currentContentVersion: row.currentContentVersion
  }));
}

/** The availability overlay the lesson engine applies: paused lessons and display order within each unit. */
export function availabilityFrom(settings: LessonSetting[]): CatalogAvailability {
  return {
    paused: settings.filter((lesson) => lesson.status === 'paused').map((lesson) => lesson.id),
    order: Object.fromEntries(settings.map((lesson) => [lesson.id, lesson.position]))
  };
}
