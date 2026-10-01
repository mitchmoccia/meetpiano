import { emptyStore } from '@learn/progress.js';
import { CURRICULUM_VERSION, JOURNEY_LESSONS, unitView, type LessonCard } from '@learn/unit.js';

export type CatalogUnit = { id: string; title: string; position: number };

export type CatalogLesson = {
  id: string;
  unitId: string;
  title: string;
  position: number;
  unlocksAfter: string | null;
  unlockNeeds: LessonCard['unlockNeeds'];
  contentVersion: string;
};

/** Units in journey order, read from the lesson code so the database never invents curriculum. */
export function catalogUnits(): CatalogUnit[] {
  return unitView(emptyStore()).units.map((unit, position) => ({ id: unit.unitId, title: unit.title, position }));
}

export function catalogLessons(): CatalogLesson[] {
  const seen = new Map<string, number>();
  return JOURNEY_LESSONS.map((card) => {
    const position = seen.get(card.unitId) ?? 0;
    seen.set(card.unitId, position + 1);
    return {
      id: card.lessonId,
      unitId: card.unitId,
      title: card.title,
      position,
      unlocksAfter: card.unlocksAfter,
      unlockNeeds: card.unlockNeeds,
      contentVersion: CURRICULUM_VERSION
    };
  });
}

const LESSON_IDS = new Set(JOURNEY_LESSONS.map((card) => card.lessonId));

export function isCatalogLesson(lessonId: string): boolean {
  return LESSON_IDS.has(lessonId);
}

export function lessonTitle(lessonId: string): string {
  return JOURNEY_LESSONS.find((card) => card.lessonId === lessonId)?.title ?? lessonId;
}

export { CURRICULUM_VERSION };
