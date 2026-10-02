import { CURRICULUM_VERSION, EVIDENCE, INPUT_MODES, PATTERN_IDS, PHASES, isIsoDate } from './progress-core.js';

export const ATTEMPT_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
const LESSON_ID_PATTERN = /^L\d{2}$/;
const VERSION_PATTERN = /^[a-z0-9][a-z0-9.-]{0,39}$/;
const ADULT_NOTES = new Set(['adult-confirmed-other-c', 'adult-confirmed-other-two-group']);
const MASTERY = new Set(['independent', 'retained']);

function isoOrNull(value) {
  return isIsoDate(value) ? new Date(value).toISOString() : null;
}

function latestActivity(attempt) {
  const times = [attempt.startedAt, attempt.completedAt, attempt.restore?.reviewPausedAt, ...(attempt.events || []).map((event) => event?.t)]
    .map((value) => (isIsoDate(value) ? Date.parse(value) : NaN))
    .filter(Number.isFinite);
  return new Date(Math.max(...times)).toISOString();
}

function tempo(value) {
  return Number.isFinite(value) && value >= 20 && value <= 320 ? value : null;
}

function details(attempt) {
  const restore = attempt.restore || {};
  const adult = attempt.adultObserved || {};
  const assistance = attempt.assistance || {};
  const patternId = attempt.patternId || restore.patternId || null;
  return {
    skillVersion: VERSION_PATTERN.test(attempt.skillVersion || '') ? attempt.skillVersion : attempt.curriculumVersion,
    patternId: PATTERN_IDS.has(patternId) ? patternId : null,
    tempoBpm: tempo(attempt.tempoBpm),
    octavePolicy: attempt.octavePolicyUsed === 'exact-pitch' ? 'exact-pitch' : 'pitch-class',
    assistance: {
      hintsUsed: assistance.hintsUsed === true,
      helpRequested: assistance.helpRequested === true,
      reducedTempo: assistance.reducedTempo === true
    },
    adult: {
      posture: adult.posture === true,
      fingering: adult.fingering === true,
      hand: adult.hand === true,
      listened: adult.listened === true,
      selfHeard: adult.selfHeard === true,
      note: ADULT_NOTES.has(adult.note) ? adult.note : null
    },
    flags: {
      helped: restore.helped === true,
      hintsOn: restore.hintsOn === true,
      sessionCheck: restore.sessionCheck === true,
      reviewPaused: Boolean(restore.reviewPausedAt),
      dynamicsPassed: restore.dynamicsPassed === true,
      finishedThrough: restore.finishedThrough === true,
      notesPassed: restore.notesPassed === true,
      rhythmPassed: restore.rhythmPassed === true,
      velocityCapable: restore.velocityCapable === true
    }
  };
}

/** Why an engine attempt cannot become a cloud summary, or null when it can. */
export function summaryProblem(attempt) {
  if (!attempt || typeof attempt !== 'object') return 'not-an-attempt';
  if (!ATTEMPT_ID_PATTERN.test(attempt.attemptId || '')) return 'attempt-id';
  if (!LESSON_ID_PATTERN.test(attempt.lessonId || '')) return 'lesson-id';
  if (attempt.historical || attempt.curriculumVersion !== CURRICULUM_VERSION) return 'other-curriculum-version';
  if (!isIsoDate(attempt.startedAt)) return 'started-at';
  if (attempt.completedAt != null && !isIsoDate(attempt.completedAt)) return 'completed-at';
  if (!PHASES.has(attempt.phase)) return 'phase';
  if (!INPUT_MODES.has(attempt.inputMode)) return 'input-mode';
  if (attempt.evidenceState != null && !EVIDENCE.has(attempt.evidenceState)) return 'evidence';
  return null;
}

/**
 * The bounded practice summary sent to the server: phase, evidence, timing, input mode, and a few checkpoint flags.
 * Note events, MIDI device names, free-text notes, and raw velocities stay on the device.
 */
export function attemptSummary(attempt) {
  if (summaryProblem(attempt)) return null;
  return {
    clientAttemptId: attempt.attemptId,
    lessonId: attempt.lessonId,
    contentVersion: attempt.curriculumVersion,
    phase: attempt.phase,
    evidenceState: attempt.evidenceState ?? null,
    inputMode: attempt.inputMode,
    startedAt: new Date(attempt.startedAt).toISOString(),
    completedAt: isoOrNull(attempt.completedAt),
    lastActivityAt: latestActivity(attempt),
    details: details(attempt)
  };
}

/** Mastery summaries must carry a completion time; a review pause clears it locally, so keep the last one seen. */
export function withRememberedCompletion(summary, rememberedCompletedAt) {
  if (!summary || summary.completedAt || !MASTERY.has(summary.evidenceState)) return summary;
  return rememberedCompletedAt ? { ...summary, completedAt: rememberedCompletedAt } : summary;
}

/** Activity time alone is not a checkpoint, so it is left out; it rides along with the next real change. */
export function summaryFingerprint(summary) {
  return JSON.stringify({ ...summary, lastActivityAt: null });
}
