import { skillIdsFor, skillMeta, isAdultObservedSkill, adultMarkFor } from './skills.js';
import { JOURNEY_LESSONS, catalogCard, evidenceRank } from './unit.js';
import { recommendNext } from './recommend.js';
import { sourceHonesty } from './evidence.js';

export const GROWNUP_HONESTY = 'This grown-up view lists what this browser already stored. It is a helper card for a person sitting nearby. It is not a login, not a parent account, and not privacy protection.';

const OFFLINE = {
  L01: 'On a real piano or a paper keyboard, point to a clump of two black keys, then a clump of three. No app needed.',
  L02: 'Find two different C doorsteps on a real piano. Point first, then play.',
  L03: 'Walk C–D–E on a tabletop, saying 1-2-3, then play it on any nearby keys.',
  L04: 'Clap Little Wave’s shape (up, then home), then hum it once away from the screen.',
  L05: 'Tap a steady heartbeat on a table while you both count 1-2-3-4.',
  L06: 'Say “stay…” on a long clap, then two short claps. No piano required.',
  L07: 'Clap, then put a finger to your lips for one beat, then clap again.',
  L08: 'Walk four steps in time: C-D-E-C with feet or fingers on a table.',
  L09: 'Find the longer house of three black keys and point to the left doorstep (F).',
  L10: 'Sing a step, a repeat, and a skip. The grown-up can play them if needed.',
  L11: 'Draw five lines on paper and put three dots that walk up. Play what you drew.',
  L12: 'Hum Porch Steps once with the screen closed, then open and check.',
  L13: 'Rest the left hand on a table and tap pinky-ring-middle. Then find a low C.',
  L14: 'Point to a bass-clef walk on paper or this page, then play those keys.',
  L15: 'Take turns: grown-up plays a short ask, learner plays a short answer.',
  L16: 'Grown-up holds one key; learner walks three neighbors on the beat.',
  L17: 'Press two table spots at the same time, then try two piano keys.',
  L18: 'Keep a slow together walk going for four clicks, then rest.',
  L19: 'Play one left key and one right key and listen for the two colors.',
  L20: 'Hold a low C and walk a short tune above it, then bow and stop.',
  L21: 'Play the same three notes twice: whisper-soft, then stronger. Listen together.',
  L22: 'Make up two endings for a tiny tune. Keep both. Neither is the only right one.',
  L23: 'Pick one job — notes, rhythm, or the sticky spot — and do only that job.',
  L24: 'Share a known piece for a listener in the room. Finish even if a note wobbles.'
};

function attemptAdultMarks(lesson) {
  const marks = { posture: false, fingering: false, hand: false, listened: false, selfHeard: false };
  for (const attempt of lesson?.attempts || []) {
    const observed = attempt.adultObserved || {};
    if (observed.posture) marks.posture = true;
    if (observed.fingering) marks.fingering = true;
    if (observed.hand) marks.hand = true;
    if (observed.listened) marks.listened = true;
    if (observed.selfHeard) marks.selfHeard = true;
  }
  return marks;
}

function skillRow(store, lessonId, lesson, skillId) {
  const meta = skillMeta(skillId);
  const skill = store?.skills?.[skillId];
  const adult = isAdultObservedSkill(skillId);
  const markKey = adultMarkFor(skillId);
  const marks = attemptAdultMarks(lesson);
  const marked = adult ? Boolean(markKey && marks[markKey]) : null;
  const state = skill?.liveEvidenceState || skill?.evidenceState || null;
  return {
    skillId,
    title: meta?.title || skillId,
    state,
    lessonState: lesson?.evidenceState || null,
    adultObserved: adult,
    adultMarked: marked,
    honesty: sourceHonesty(skill?.lanes?.[state]?.inputMode || lesson?.attempts?.at(-1)?.inputMode)
  };
}

export function observedLessons(store) {
  const rows = [];
  for (const card of JOURNEY_LESSONS) {
    const lesson = store?.lessons?.[card.lessonId];
    if (!lesson?.evidenceState) continue;
    rows.push({
      lessonId: card.lessonId,
      title: card.title,
      evidenceState: lesson.evidenceState,
      inputMode: lesson.attempts?.at(-1)?.inputMode || null,
      honesty: sourceHonesty(lesson.attempts?.at(-1)?.inputMode),
      adultMarks: attemptAdultMarks(lesson),
      skills: skillIdsFor(card.lessonId).map((skillId) => skillRow(store, card.lessonId, lesson, skillId))
    });
  }
  return rows;
}

export function suggestOfflinePractice(store) {
  const rec = recommendNext(store, store?.session);
  const lessonId = rec?.lessonId && catalogCard(rec.lessonId) ? rec.lessonId : 'L01';
  const card = catalogCard(lessonId);
  return {
    lessonId,
    title: card?.title || rec?.title || 'Meet the keyboard',
    activity: OFFLINE[lessonId] || OFFLINE.L01,
    fromRecommendation: rec?.kind || 'forward'
  };
}

export function grownupReport(store) {
  const observed = observedLessons(store);
  const practicedCount = observed.filter((row) => evidenceRank(row.evidenceState) >= 2).length;
  return {
    observed,
    observedCount: observed.length,
    practicedCount,
    practice: suggestOfflinePractice(store),
    honesty: GROWNUP_HONESTY,
    deviceOnly: true,
    notPrivacyProduct: true,
    noAccount: true
  };
}

export { OFFLINE };
