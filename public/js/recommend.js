import { evidenceRank, JOURNEY_LESSONS, nextLessonId, unitView } from './unit.js';
import { sourceHonesty } from './evidence.js';

function cardTitle(lessonId) {
  return JOURNEY_LESSONS.find((item) => item.lessonId === lessonId)?.title || lessonId;
}

function easierPending(store) {
  for (const [lessonId, lesson] of Object.entries(store?.lessons || {})) {
    const open = lesson.attempts?.find((attempt) => !attempt.completedAt && attempt.restore?.easierWork);
    if (open) {
      return {
        lessonId,
        title: cardTitle(lessonId),
        reason: 'Recent misses on the same check. This visit uses an easier pattern, not the same hard retry.'
      };
    }
  }
  return null;
}

export function recommendNext(store, session = store?.session) {
  const view = unitView(store);
  const cards = view.units.flatMap((unit) => unit.cards);
  const easier = easierPending(store);
  if (easier) {
    return {
      kind: 'easier',
      lessonId: easier.lessonId,
      title: easier.title,
      reason: easier.reason,
      href: `/learn/?lesson=${easier.lessonId}`,
      action: `Try the easier path in ${easier.title}`
    };
  }

  const inProgress = cards.find((card) => card.inProgress && card.unlocked && evidenceRank(card.evidenceState) < 3);
  if (inProgress) {
    return {
      kind: 'continue',
      lessonId: inProgress.lessonId,
      title: inProgress.title,
      reason: 'This device still has an unfinished try. Independent is not invented from a replay.',
      href: `/learn/?lesson=${inProgress.lessonId}`,
      action: `Continue ${inProgress.title}`
    };
  }

  if (session?.isNew) {
    const review = [...cards].reverse().find((card) => card.unlocked && card.evidenceState === 'independent');
    if (review) {
      return {
        kind: 'review-transfer',
        lessonId: review.lessonId,
        title: review.title,
        reason: `A new visit. ${review.title} is Independent on this device. This check uses another pattern, not the same home try again.`,
        href: `/learn/?lesson=${review.lessonId}&check=review`,
        action: `Review ${review.title} another way`,
        patternId: 'transfer'
      };
    }
  }

  const forward = cards.find((card) => card.unlocked && evidenceRank(card.evidenceState) < 3);
  if (forward) {
    return {
      kind: 'forward',
      lessonId: forward.lessonId,
      title: forward.title,
      reason: evidenceRank(forward.evidenceState) >= 2
        ? `${forward.title} is Practiced on this device. Independent still needs a quiet check with hints off.`
        : `${forward.title} is the next unlocked activity on this device.`,
      href: `/learn/?lesson=${forward.lessonId}`,
      action: evidenceRank(forward.evidenceState) >= 1 ? `Open ${forward.title}` : `Start ${forward.title}`
    };
  }

  const waiting = cards.find((card) => card.unlocked && card.evidenceState === 'independent');
  if (waiting) {
    return {
      kind: 'review-when-ready',
      lessonId: waiting.lessonId,
      title: waiting.title,
      reason: `${waiting.title} is Independent. Retained waits for a later visit or a named pause, using another pattern.`,
      href: `/learn/?lesson=${waiting.lessonId}&check=review`,
      action: `Later check: ${waiting.title}`
    };
  }

  const last = cards.filter((card) => card.unlocked).at(-1);
  return {
    kind: 'rest',
    lessonId: last?.lessonId || 'L01',
    title: last?.title || 'Meet the keyboard',
    reason: 'This device already has saved records. Replaying does not manufacture extra mastery.',
    href: '/learn/',
    action: 'Stay on the journey'
  };
}

export function recommendAfterLesson(store, lessonId, session) {
  const next = nextLessonId(lessonId);
  const rec = recommendNext(store, session);
  if (rec.kind === 'easier' || rec.kind === 'review-transfer') return rec;
  if (next && rec.lessonId === next) return rec;
  return rec;
}

export function laneSummary(lesson) {
  const lanes = lesson?.evidenceLanes || {};
  return ['explored', 'practiced', 'independent', 'retained'].map((state) => {
    const lane = lanes[state];
    return {
      state,
      earned: Boolean(lane) && lane.invalidated !== true,
      honesty: lane ? sourceHonesty(lane.inputMode) : '',
      midiVerified: lane?.midiVerified === true
    };
  });
}
