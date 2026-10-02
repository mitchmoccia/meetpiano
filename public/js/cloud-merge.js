import { EVIDENCE_RANK, isPlainObject, promoteEvidence } from './progress-core.js';
import { emptyLesson, emptyStore } from './progress.js';
import { applySkillFromLesson, highestLane, writeLane } from './evidence.js';
import { emptyLanes, emptySkill, skillIdsFor } from './skills.js';

const LANES = ['explored', 'practiced', 'independent', 'retained'];
const MAX_ATTEMPTS_PER_LESSON = 40;

function rank(state) {
  return EVIDENCE_RANK[state] || 0;
}

/** Turns a server attempt row into an engine attempt. Cloud attempts are never resumed on this device. */
export function cloudAttempt(row) {
  const flags = row.details?.flags || {};
  const adult = row.details?.adult || {};
  return {
    attemptId: row.clientAttemptId,
    lessonId: row.lessonId,
    curriculumVersion: row.contentVersion,
    skillIds: skillIdsFor(row.lessonId),
    skillVersion: row.details?.skillVersion || row.contentVersion,
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? null,
    inputMode: row.inputMode,
    inputDevice: null,
    audioUnlocked: false,
    phase: row.completedAt ? 'result' : row.phase,
    evidenceState: row.evidenceState ?? null,
    events: [],
    adultObserved: {
      posture: adult.posture === true,
      fingering: adult.fingering === true,
      hand: adult.hand === true,
      listened: adult.listened === true,
      selfHeard: adult.selfHeard === true,
      note: adult.note || undefined
    },
    octavePolicyUsed: row.details?.octavePolicy || 'pitch-class',
    assistance: { ...(row.details?.assistance || {}) },
    tempoBpm: row.details?.tempoBpm ?? null,
    patternId: row.details?.patternId ?? null,
    sessionId: null,
    exportable: true,
    origin: 'cloud',
    restore: {
      hintsOn: flags.hintsOn === true,
      helped: flags.helped === true,
      sessionCheck: flags.sessionCheck === true,
      dynamicsPassed: flags.dynamicsPassed === true,
      finishedThrough: flags.finishedThrough === true,
      notesPassed: flags.notesPassed === true,
      rhythmPassed: flags.rhythmPassed === true,
      velocityCapable: flags.velocityCapable === true,
      patternId: row.details?.patternId ?? null
    }
  };
}

function replayCompletion(store, lesson, attempt) {
  const granted = attempt.evidenceState;
  if (!granted) return;
  const lanes = lesson.evidenceLanes;
  writeLane(lanes, granted, attempt);
  if (granted === 'retained') writeLane(lanes, 'independent', attempt);
  if (granted === 'independent' || granted === 'retained') {
    writeLane(lanes, 'practiced', attempt, { assisted: true });
    writeLane(lanes, 'explored', attempt);
  }
  if (granted === 'practiced') writeLane(lanes, 'explored', attempt);
  lesson.evidenceState = highestLane(lanes) || promoteEvidence(lesson.evidenceState, granted);
  applySkillFromLesson(store, lesson, attempt, granted);
}

function settleLesson(lesson) {
  for (const attempt of lesson.attempts) lesson.evidenceState = promoteEvidence(lesson.evidenceState, attempt.evidenceState);
  const mastered = lesson.attempts
    .filter((attempt) => attempt.completedAt && rank(attempt.evidenceState) >= 3)
    .map((attempt) => attempt.firstCompletedAt || attempt.completedAt)
    .sort();
  lesson.firstCompletionRewarded = rank(lesson.evidenceState) >= 3;
  lesson.firstCompletedAt = lesson.firstCompletionRewarded ? (mastered[0] ?? null) : null;
}

/**
 * Rebuilds a learner store from server attempt rows by replaying completions in order with the evidence each
 * attempt already earned. It never re-grades an attempt, so the result cannot claim more than the rows do.
 */
export function deriveStoreFromAttempts(rows) {
  const store = emptyStore();
  const attempts = rows.map((row) => ({ ...cloudAttempt(row), firstCompletedAt: row.firstCompletedAt ?? row.completedAt ?? null }));
  for (const attempt of attempts) {
    store.lessons[attempt.lessonId] ??= emptyLesson(attempt.lessonId);
    store.lessons[attempt.lessonId].attempts.push(attempt);
  }
  const completed = attempts.filter((attempt) => attempt.completedAt).sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  for (const attempt of completed) replayCompletion(store, store.lessons[attempt.lessonId], attempt);
  for (const lesson of Object.values(store.lessons)) {
    settleLesson(lesson);
    lesson.attempts.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    lesson.attempts = lesson.attempts.slice(-MAX_ATTEMPTS_PER_LESSON);
    for (const attempt of lesson.attempts) delete attempt.firstCompletedAt;
  }
  return store;
}

function fillLanes(target, source) {
  if (!isPlainObject(source)) return;
  for (const state of LANES) {
    if (!target[state] && isPlainObject(source[state])) target[state] = { ...source[state] };
  }
}

function mergeLesson(local, cloud) {
  local.evidenceLanes ||= emptyLanes();
  fillLanes(local.evidenceLanes, cloud.evidenceLanes);
  local.evidenceState = promoteEvidence(promoteEvidence(local.evidenceState, cloud.evidenceState), highestLane(local.evidenceLanes));
  if (cloud.firstCompletionRewarded && rank(local.evidenceState) >= 3 && !local.firstCompletionRewarded) {
    local.firstCompletionRewarded = true;
    local.firstCompletedAt = local.firstCompletedAt || cloud.firstCompletedAt || null;
  }
}

/** Attempts recorded here are kept as they are; copies that came from the cloud are refreshed with the server's latest. */
function mergeAttempts(local, cloudAttempts) {
  const index = new Map(local.attempts.map((attempt, position) => [attempt.attemptId, position]));
  for (const attempt of cloudAttempts) {
    const position = index.get(attempt.attemptId);
    if (position === undefined) local.attempts.push(attempt);
    else if (local.attempts[position].origin === 'cloud') local.attempts[position] = attempt;
  }
  local.attempts.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  while (local.attempts.length > MAX_ATTEMPTS_PER_LESSON) {
    const index = local.attempts.findIndex((attempt) => attempt.origin === 'cloud' && attempt.attemptId !== local.currentAttemptId);
    local.attempts.splice(index >= 0 ? index : 0, 1);
  }
}

function mergeSkill(store, skillId, cloud) {
  const skill = store.skills[skillId] || emptySkill(skillId);
  skill.lanes ||= emptyLanes();
  fillLanes(skill.lanes, cloud.lanes);
  skill.liveEvidenceState = highestLane(skill.lanes);
  skill.evidenceState = skill.liveEvidenceState;
  store.skills[skillId] = skill;
}

/**
 * Adds cloud progress to a local store. Local attempts and lanes always win; cloud data only fills gaps,
 * so merging never lowers what this device already shows.
 */
export function mergeCloudIntoStore(store, cloud) {
  const byLesson = new Map();
  for (const row of cloud.attempts || []) {
    const list = byLesson.get(row.lessonId) || [];
    list.push(cloudAttempt(row));
    byLesson.set(row.lessonId, list);
  }
  for (const [lessonId, attempts] of byLesson) {
    store.lessons[lessonId] ??= emptyLesson(lessonId);
    mergeAttempts(store.lessons[lessonId], attempts);
  }
  for (const [lessonId, lesson] of Object.entries(cloud.lessons || {})) {
    store.lessons[lessonId] ??= emptyLesson(lessonId);
    mergeLesson(store.lessons[lessonId], lesson);
  }
  store.skills ||= {};
  for (const [skillId, skill] of Object.entries(cloud.skills || {})) mergeSkill(store, skillId, skill);
  return store;
}

/** The slice of a derived store the learner page needs to rebuild lanes and skills on another device. */
export function cloudProgressView(store) {
  const lessons = {};
  for (const [lessonId, lesson] of Object.entries(store.lessons)) {
    lessons[lessonId] = {
      evidenceState: lesson.evidenceState,
      evidenceLanes: lesson.evidenceLanes,
      firstCompletionRewarded: lesson.firstCompletionRewarded,
      firstCompletedAt: lesson.firstCompletedAt
    };
  }
  const skills = {};
  for (const [skillId, skill] of Object.entries(store.skills || {})) skills[skillId] = { lanes: skill.lanes, evidenceState: skill.evidenceState };
  return { lessons, skills };
}
