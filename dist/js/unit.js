import { emptyLesson } from './progress.js';

export const UNIT_ID = 'first-notes';
export const UNIT_TITLE = 'First Notes';
export const RHYTHM_UNIT_ID = 'rhythm-club';
export const RHYTHM_UNIT_TITLE = 'Rhythm Club';
export const CURRICULUM_VERSION = 'beginner-v1';

const EVIDENCE_RANK = { explored: 1, practiced: 2, independent: 3, retained: 4 };

export const FIRST_NOTES_LESSONS = [
  {
    lessonId: 'L01',
    title: 'Meet the keyboard',
    blurb: 'High and low. Houses of two and three.',
    unlocksAfter: null,
    unlockNeeds: null,
    unitId: UNIT_ID
  },
  {
    lessonId: 'L02',
    title: 'Find C',
    blurb: 'C sits left of two black keys.',
    unlocksAfter: 'L01',
    unlockNeeds: 'practiced',
    unitId: UNIT_ID
  },
  {
    lessonId: 'L03',
    title: 'Neighbors C–D–E',
    blurb: 'Walk to the next white keys.',
    unlocksAfter: 'L02',
    unlockNeeds: 'practiced',
    unitId: UNIT_ID
  },
  {
    lessonId: 'L04',
    title: 'First little tune',
    blurb: 'Little Wave, then a cousin.',
    unlocksAfter: 'L03',
    unlockNeeds: 'independent',
    unitId: UNIT_ID
  }
];

export const RHYTHM_CLUB_LESSONS = [
  {
    lessonId: 'L05',
    title: 'Hear the heartbeat',
    blurb: 'Tap C with the clock.',
    unlocksAfter: 'L04',
    unlockNeeds: 'independent',
    unitId: RHYTHM_UNIT_ID
  },
  {
    lessonId: 'L06',
    title: 'Long and short',
    blurb: 'Hold, then two quick waves.',
    unlocksAfter: 'L05',
    unlockNeeds: 'practiced',
    unitId: RHYTHM_UNIT_ID
  },
  {
    lessonId: 'L07',
    title: 'Silence belongs',
    blurb: 'Leave a hole on purpose.',
    unlocksAfter: 'L06',
    unlockNeeds: 'practiced',
    unitId: RHYTHM_UNIT_ID
  },
  {
    lessonId: 'L08',
    title: 'Notes with a beat',
    blurb: 'C–D–E–C on the heartbeat.',
    unlocksAfter: 'L07',
    unlockNeeds: 'independent',
    unitId: RHYTHM_UNIT_ID
  }
];

export const JOURNEY_LESSONS = [...FIRST_NOTES_LESSONS, ...RHYTHM_CLUB_LESSONS];

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

export function catalogCard(lessonId) {
  return JOURNEY_LESSONS.find((item) => item.lessonId === lessonId) || null;
}

export function isRhythmLesson(lessonId) {
  return RHYTHM_CLUB_LESSONS.some((item) => item.lessonId === lessonId);
}

export function isLessonUnlocked(store, lessonId) {
  const card = catalogCard(lessonId);
  if (!card) return false;
  if (!card.unlocksAfter) return true;
  return meetsUnlock(lessonFromStore(store, card.unlocksAfter).evidenceState, card.unlockNeeds);
}

export function nextLessonId(lessonId) {
  const index = JOURNEY_LESSONS.findIndex((item) => item.lessonId === lessonId);
  if (index < 0 || index === JOURNEY_LESSONS.length - 1) return null;
  return JOURNEY_LESSONS[index + 1].lessonId;
}

export function parseLessonId(value) {
  if (typeof value !== 'string') return null;
  const id = value.trim().toUpperCase();
  return JOURNEY_LESSONS.some((item) => item.lessonId === id) ? id : null;
}

export function parseUnitId(value) {
  if (typeof value !== 'string') return null;
  const id = value.trim().toLowerCase();
  if (id === UNIT_ID || id === 'first-notes') return UNIT_ID;
  if (id === RHYTHM_UNIT_ID || id === 'rhythm') return RHYTHM_UNIT_ID;
  return null;
}

function mapCards(list, store) {
  return list.map((card) => {
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
}

function pickContinue(cards) {
  return cards.find((card) => card.inProgress && card.unlocked)
    || cards.find((card) => card.unlocked && evidenceRank(card.evidenceState) < 3)
    || cards.find((card) => card.unlocked);
}

export function unitView(store) {
  const firstCards = mapCards(FIRST_NOTES_LESSONS, store);
  const rhythmCards = mapCards(RHYTHM_CLUB_LESSONS, store);
  const all = [...firstCards, ...rhythmCards];
  const continueCard = pickContinue(all);
  return {
    unitId: UNIT_ID,
    title: UNIT_TITLE,
    cards: firstCards,
    units: [
      {
        unitId: UNIT_ID,
        title: UNIT_TITLE,
        kicker: 'WORLD · FIRST NOTES',
        unlocked: true,
        cards: firstCards
      },
      {
        unitId: RHYTHM_UNIT_ID,
        title: RHYTHM_UNIT_TITLE,
        kicker: 'WORLD · RHYTHM CLUB',
        unlocked: isLessonUnlocked(store, 'L05'),
        cards: rhythmCards
      }
    ],
    continueLessonId: continueCard?.lessonId || 'L01'
  };
}
