import { recommendNext } from './recommend.js';
import { isLessonUnlocked, unitView } from './unit.js';

export const CLOSER_OVERLAY_ID = 'session-closer-overlay';
export const CLOSER_CONTROL_ID = 'enough-today';
export const CLOSER_RESUME_ID = 'enough-today-resume';
export const CLOSER_STAY_ID = 'enough-today-stay';
export const CLOSER_HUB_ID = 'enough-today-hub';
export const CLOSER_CUE_ID = 'enough-today-cue';

export const CLOSER_COPY = {
  controlLabel: 'Enough for today',
  eyebrow: 'ENOUGH FOR TODAY',
  title: 'That was a good sit.',
  lead: 'Stopping is okay. You do not have to do more right now. Saved records stay on this device.',
  resumeLead: 'Next time you can open the next unlocked job, or the same Continue on the journey map.',
  stayLabel: 'Stay a little longer',
  hubLabel: 'Back to the journey',
  pauseDistinct: 'This is not Pause. Pause keeps a try waiting. Enough for today just ends the sit kindly.'
};

function hasJourneyProgress(store) {
  return Object.values(store?.lessons || {}).some((lesson) => Boolean(lesson?.evidenceState));
}

function continueCardFor(store) {
  const view = unitView(store);
  return view.units
    .flatMap((unit) => unit.cards)
    .find((card) => card.lessonId === view.continueLessonId) || null;
}

function fallbackTarget() {
  return {
    lessonId: 'L01',
    title: 'Meet the keyboard',
    action: 'Start Meet the keyboard',
    href: '/learn/?lesson=L01',
    reason: 'Meet the keyboard is the next unlocked activity on this device.',
    source: 'forward',
    unlocked: true
  };
}

function lessonHref(lessonId) {
  return `/learn/?lesson=${lessonId}`;
}

export function closerResumeTarget(store, session = store?.session) {
  const rec = recommendNext(store, session);
  const continueCard = continueCardFor(store);
  const hasProgress = hasJourneyProgress(store);

  let pick;
  if (hasProgress && continueCard?.unlocked) {
    pick = {
      lessonId: continueCard.lessonId,
      title: continueCard.title,
      action: `Continue ${continueCard.title}`,
      href: lessonHref(continueCard.lessonId),
      reason: rec?.lessonId === continueCard.lessonId
        ? rec.reason
        : `${continueCard.title} is the next unlocked activity on this device.`,
      source: 'continue'
    };
  } else if (rec && isLessonUnlocked(store, rec.lessonId)) {
    pick = {
      lessonId: rec.lessonId,
      title: rec.title,
      action: rec.action,
      href: lessonHref(rec.lessonId),
      reason: rec.reason,
      source: rec.kind
    };
  } else {
    pick = fallbackTarget();
  }

  if (!isLessonUnlocked(store, pick.lessonId)) return fallbackTarget();
  return { ...pick, unlocked: true };
}
