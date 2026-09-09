import { emptyLesson } from './progress.js';

export const UNIT_ID = 'first-notes';
export const UNIT_TITLE = 'First Notes';
export const CURRICULUM_VERSION = 'beginner-v1';

const EVIDENCE_RANK = { explored: 1, practiced: 2, independent: 3, retained: 4 };

export const FIRST_NOTES_LESSONS = [
  {
    lessonId: 'L01',
    title: 'Meet the keyboard',
    blurb: 'High and low. Houses of two and three.',
    unlocksAfter: null,
    unlockNeeds: null
  },
  {
    lessonId: 'L02',
    title: 'Find C',
    blurb: 'C sits left of two black keys.',
    unlocksAfter: 'L01',
    unlockNeeds: 'practiced'
  },
  {
    lessonId: 'L03',
    title: 'Neighbors C–D–E',
    blurb: 'Walk to the next white keys.',
    unlocksAfter: 'L02',
    unlockNeeds: 'practiced'
  },
  {
    lessonId: 'L04',
    title: 'First little tune',
    blurb: 'Little Wave, then a cousin.',
    unlocksAfter: 'L03',
    unlockNeeds: 'independent'
  }
];

export function evidenceRank(state) {
  return EVIDENCE_RANK[state] || 0;
}

export function lessonFromStore(store, lessonId) {
  return store?.lessons?.[lessonId] || emptyLesson(lessonId);
}

export function meetsUnlock(state, needs) {
  if (!needs) return true;
  return evidenceRank(state) >= evidenceRank(needs);
}

export function isLessonUnlocked(store, lessonId) {
  const card = FIRST_NOTES_LESSONS.find((item) => item.lessonId === lessonId);
  if (!card) return false;
  if (!card.unlocksAfter) return true;
  return meetsUnlock(lessonFromStore(store, card.unlocksAfter).evidenceState, card.unlockNeeds);
}

export function nextLessonId(lessonId) {
  const index = FIRST_NOTES_LESSONS.findIndex((item) => item.lessonId === lessonId);
  if (index < 0 || index === FIRST_NOTES_LESSONS.length - 1) return null;
  return FIRST_NOTES_LESSONS[index + 1].lessonId;
}

export function parseLessonId(value) {
  if (typeof value !== 'string') return null;
  const id = value.trim().toUpperCase();
  return FIRST_NOTES_LESSONS.some((item) => item.lessonId === id) ? id : null;
}

export function unitView(store) {
  const cards = FIRST_NOTES_LESSONS.map((card) => {
    const lesson = lessonFromStore(store, card.lessonId);
    const unlocked = isLessonUnlocked(store, card.lessonId);
    const inProgress = Boolean(lesson.currentAttemptId);
    return {
      ...card,
      evidenceState: lesson.evidenceState,
      unlocked,
      inProgress,
      firstCompletionRewarded: lesson.firstCompletionRewarded === true
    };
  });
  const continueCard = cards.find((card) => card.inProgress && card.unlocked)
    || cards.find((card) => card.unlocked && evidenceRank(card.evidenceState) < 3)
    || cards.find((card) => card.unlocked);
  return {
    unitId: UNIT_ID,
    title: UNIT_TITLE,
    cards,
    continueLessonId: continueCard?.lessonId || 'L01'
  };
}
