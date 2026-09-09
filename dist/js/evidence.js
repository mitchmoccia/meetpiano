import { promoteEvidence } from './progress-core.js';
import {
  adultMarkFor,
  canAutoRetain,
  currentSkillVersion,
  emptyLanes,
  emptySkill,
  isAdultObservedSkill,
  skillIdsFor,
  skillMeta
} from './skills.js';

export const SESSION_GAP_MS = 4 * 60 * 60 * 1000;
export const EASIER_AFTER = 3;
export const EVIDENCE_LANES = ['explored', 'practiced', 'independent', 'retained'];

export function isMidiVerifiedSource(inputMode) {
  return inputMode === 'midi';
}

export function sourceHonesty(inputMode) {
  if (inputMode === 'midi') return 'Heard over MIDI. Not a hardware certification.';
  if (inputMode === 'touch') return 'Touch practice. Not MIDI verified.';
  if (inputMode === 'computer-keys') return 'Computer keys. Not MIDI verified.';
  if (inputMode === 'mixed') return 'Mixed input. Not MIDI verified.';
  return 'Saved on this device only.';
}

export function emptyEvidenceLanes() {
  return emptyLanes();
}

export function laneRecord(attempt, extras = {}) {
  return {
    earnedAt: attempt.completedAt || attempt.startedAt || new Date().toISOString(),
    attemptId: attempt.attemptId,
    inputMode: attempt.inputMode || 'touch',
    midiVerified: isMidiVerifiedSource(attempt.inputMode),
    assisted: Boolean(attempt.restore?.helped || attempt.restore?.hintsOn || extras.assisted),
    patternId: attempt.patternId || attempt.restore?.patternId || extras.patternId || null,
    tempoBpm: Number.isFinite(attempt.tempoBpm) ? attempt.tempoBpm : extras.tempoBpm ?? null,
    skillVersion: attempt.skillVersion || extras.skillVersion || null
  };
}

export function highestLane(lanes) {
  if (!lanes) return null;
  if (lanes.retained && !lanes.retained.invalidated) return 'retained';
  if (lanes.independent && !lanes.independent.invalidated) return 'independent';
  if (lanes.practiced && !lanes.practiced.invalidated) return 'practiced';
  if (lanes.explored && !lanes.explored.invalidated) return 'explored';
  return null;
}

export function hasReviewGap(attempt, session, independentEarnedAt) {
  if (attempt?.restore?.reviewPausedAt) return true;
  if (attempt?.restore?.sessionCheck === true && session?.isNew) return true;
  if (!independentEarnedAt || !attempt?.startedAt) return false;
  const earned = Date.parse(independentEarnedAt);
  const started = Date.parse(attempt.startedAt);
  if (Number.isNaN(earned) || Number.isNaN(started)) return false;
  return started - earned >= SESSION_GAP_MS;
}

export function resolveGrantedEvidence({ lesson, attempt, requested, session }) {
  const helped = Boolean(attempt?.restore?.helped && attempt?.restore?.hintsOn);
  const current = lesson?.evidenceState || null;
  const independentAt = lesson?.evidenceLanes?.independent?.earnedAt || lesson?.firstCompletedAt;
  const patternId = attempt?.patternId || attempt?.restore?.patternId || null;
  const sameHomeReplay = patternId === 'home' || (!patternId && requested === 'independent' && current === 'independent');

  if (requested === 'retained') {
    if (helped) return current === 'retained' ? 'retained' : (current === 'independent' ? 'independent' : current);
    if (!independentAt && current !== 'independent' && current !== 'retained') {
      return current === 'practiced' || attempt?.restore?.sessionCheck ? 'practiced' : 'independent';
    }
    if (!hasReviewGap(attempt, session, independentAt)) {
      return current === 'retained' ? 'retained' : 'independent';
    }
    if (sameHomeReplay && !attempt?.restore?.sessionCheck && !attempt?.restore?.reviewPausedAt) {
      return current === 'retained' ? 'retained' : 'independent';
    }
    return 'retained';
  }

  if (requested === 'independent') {
    if (helped) return promoteEvidence(current, 'practiced');
    if (current === 'retained') return 'retained';
    return 'independent';
  }

  return requested || current;
}

export function writeLane(lanes, state, attempt, extras = {}) {
  if (!state || !lanes) return lanes;
  const existing = lanes[state];
  if (existing) {
    if (existing.midiVerified || !isMidiVerifiedSource(attempt.inputMode)) return lanes;
    return lanes;
  }
  lanes[state] = laneRecord(attempt, extras);
  return lanes;
}

export function attemptCountsTowardLive(attempt, skillId) {
  if (!attempt) return false;
  const liveVersion = currentSkillVersion(skillId);
  const skillVersion = attempt.skillVersion || attempt.curriculumVersion;
  if (liveVersion && skillVersion && skillVersion !== liveVersion) return false;
  return true;
}

export function skillCapForAttempt(skillId, attempt, granted) {
  let next = granted;
  if (isAdultObservedSkill(skillId)) {
    const mark = adultMarkFor(skillId);
    const observed = mark ? attempt?.adultObserved?.[mark] === true : false;
    if (!observed && (next === 'independent' || next === 'retained')) next = 'practiced';
  }
  if (next === 'retained' && !canAutoRetain(skillId)) next = 'independent';
  if (skillId === 'S-REPLAY' && granted !== 'retained') next = granted === 'independent' ? 'practiced' : granted;
  if (skillId === 'S-REPLAY' && granted === 'retained') next = 'retained';
  return next;
}

export function applySkillFromLesson(store, lesson, attempt, granted) {
  if (!store.skills) store.skills = {};
  const ids = skillIdsFor(lesson.lessonId);
  for (const skillId of ids) {
    if (!attemptCountsTowardLive(attempt, skillId)) continue;
    const cap = skillCapForAttempt(skillId, attempt, granted);
    const skill = store.skills[skillId] || emptySkill(skillId);
    if (skill.invalidated && (cap === 'independent' || cap === 'retained')) continue;
    if (!skill.lanes) skill.lanes = emptyLanes();
    writeLane(skill.lanes, cap, attempt, { skillVersion: skill.skillVersion });
    if (cap && cap !== granted && (granted === 'independent' || granted === 'retained')) {
      writeLane(skill.lanes, cap, attempt, { skillVersion: skill.skillVersion });
    }
    if (cap === 'independent' || cap === 'practiced' || cap === 'explored') {
      writeLane(skill.lanes, cap, attempt);
    }
    skill.liveEvidenceState = highestLane(skill.lanes);
    skill.evidenceState = skill.invalidated ? skill.liveEvidenceState : highestLane(skill.lanes);
    skill.skillVersion = currentSkillVersion(skillId) || skill.skillVersion;
    store.skills[skillId] = skill;
  }
  return store;
}

export function applyLessonOutcome(store, lesson, attempt, requested, session) {
  const granted = resolveGrantedEvidence({ lesson, attempt, requested, session });
  if (granted) attempt.evidenceState = promoteEvidence(attempt.evidenceState, granted);
  if (!lesson.evidenceLanes) lesson.evidenceLanes = emptyLanes();
  writeLane(lesson.evidenceLanes, granted, attempt);
  if (granted === 'independent' || granted === 'retained') {
    writeLane(lesson.evidenceLanes, 'practiced', attempt, { assisted: true });
    writeLane(lesson.evidenceLanes, 'explored', attempt);
  }
  if (granted === 'practiced') writeLane(lesson.evidenceLanes, 'explored', attempt);
  lesson.evidenceState = highestLane(lesson.evidenceLanes) || promoteEvidence(lesson.evidenceState, granted);
  applySkillFromLesson(store, lesson, attempt, granted);
  return granted;
}

export function invalidateSkills(store, skillIds, reason = 'skill-contract-changed') {
  if (!store.skills) store.skills = {};
  const changed = new Set(skillIds || []);
  for (const skillId of changed) {
    const skill = store.skills[skillId] || emptySkill(skillId);
    skill.invalidated = true;
    skill.invalidReason = reason;
    if (skill.lanes?.independent) skill.lanes.independent.invalidated = true;
    if (skill.lanes?.retained) skill.lanes.retained.invalidated = true;
    skill.liveEvidenceState = highestLane(skill.lanes);
    skill.evidenceState = skill.liveEvidenceState;
    store.skills[skillId] = skill;
  }
  for (const lesson of Object.values(store.lessons || {})) {
    const ids = skillIdsFor(lesson.lessonId);
    if (!ids.some((id) => changed.has(id))) continue;
    if (lesson.evidenceLanes?.independent) lesson.evidenceLanes.independent.invalidated = true;
    if (lesson.evidenceLanes?.retained) lesson.evidenceLanes.retained.invalidated = true;
    lesson.evidenceState = highestLane(lesson.evidenceLanes);
    if (lesson.evidenceState === 'independent' || lesson.evidenceState === 'retained') {
      lesson.evidenceState = 'practiced';
    }
  }
  return store;
}

export function recordMissOn(attempt, kind = 'miss') {
  if (!attempt.restore) attempt.restore = {};
  if (!attempt.restore.mistakeKinds || typeof attempt.restore.mistakeKinds !== 'object') {
    attempt.restore.mistakeKinds = {};
  }
  const key = typeof kind === 'string' && kind ? kind.slice(0, 40) : 'miss';
  attempt.restore.mistakeKinds[key] = (attempt.restore.mistakeKinds[key] || 0) + 1;
  const streak = attempt.restore.mistakeKinds[key];
  const easier = streak >= EASIER_AFTER;
  if (easier) attempt.restore.easierWork = true;
  return { kind: key, streak, easier };
}

export function skillTitle(skillId) {
  return skillMeta(skillId)?.title || skillId;
}
