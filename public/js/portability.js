import {
  CURRICULUM_VERSION,
  SCHEMA_VERSION,
  emptyStore,
  validateAttempt,
  validateLesson,
  validateStore
} from './progress.js';
import { SKILL_CATALOG_VERSION, knownSkillId } from './skills.js';
import { EVIDENCE } from './progress-core.js';

export const EXPORT_KIND = 'meetpiano-progress';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function exportProgress(store) {
  const checked = validateStore(store);
  const safe = checked.ok ? checked.store : emptyStore();
  return {
    kind: EXPORT_KIND,
    schemaVersion: SCHEMA_VERSION,
    curriculumVersion: CURRICULUM_VERSION,
    skillCatalogVersion: SKILL_CATALOG_VERSION,
    exportedAt: new Date().toISOString(),
    deviceLocal: true,
    store: safe
  };
}

export function validateExport(payload) {
  if (!isPlainObject(payload)) return { ok: false, reason: 'not-object' };
  if (payload.kind !== EXPORT_KIND) return { ok: false, reason: 'kind' };
  if (payload.schemaVersion !== SCHEMA_VERSION && payload.schemaVersion !== 1) {
    return { ok: false, reason: 'schema' };
  }
  if (typeof payload.curriculumVersion !== 'string' || !payload.curriculumVersion) {
    return { ok: false, reason: 'curriculum' };
  }
  if (!isPlainObject(payload.store)) return { ok: false, reason: 'store' };
  const checked = validateStore({
    ...payload.store,
    schemaVersion: payload.store.schemaVersion || payload.schemaVersion,
    curriculumVersion: payload.store.curriculumVersion || payload.curriculumVersion
  });
  if (!checked.ok) return { ok: false, reason: checked.reason || 'store' };
  return { ok: true, bundle: { ...payload, store: checked.store } };
}

function mergeAttempts(current, incoming) {
  const byId = new Map();
  for (const attempt of current || []) byId.set(attempt.attemptId, attempt);
  for (const attempt of incoming || []) {
    if (!attempt?.attemptId) continue;
    if (byId.has(attempt.attemptId)) continue;
    const valid = validateAttempt(attempt, attempt.lessonId);
    if (valid) byId.set(valid.attemptId, valid);
  }
  return [...byId.values()].slice(-40);
}

function mergeLesson(current, incoming, lessonId) {
  const attempts = mergeAttempts(current?.attempts, incoming?.attempts);
  const combined = validateLesson({
    ...(incoming || {}),
    ...(current || {}),
    attempts,
    lessonId,
    evidenceState: current?.evidenceState || incoming?.evidenceState || null,
    evidenceLanes: current?.evidenceLanes || incoming?.evidenceLanes,
    firstCompletionRewarded: current?.firstCompletionRewarded === true || incoming?.firstCompletionRewarded === true,
    firstCompletedAt: current?.firstCompletedAt || incoming?.firstCompletedAt || null
  }, lessonId);
  const earnedIndependent = attempts.some((attempt) => attempt.evidenceState === 'independent' && attempt.completedAt && !attempt.historical);
  const earnedRetained = attempts.some((attempt) => attempt.evidenceState === 'retained' && attempt.completedAt && !attempt.historical);
  if (combined.evidenceState === 'retained' && !earnedRetained) {
    combined.evidenceState = earnedIndependent ? 'independent' : combined.evidenceState === 'retained' ? 'practiced' : combined.evidenceState;
  }
  if (combined.evidenceState === 'independent' && !earnedIndependent) {
    combined.evidenceState = attempts.reduce((best, attempt) => {
      if (attempt.historical || !attempt.completedAt) return best;
      if (attempt.evidenceState === 'practiced') return 'practiced';
      if (attempt.evidenceState === 'explored' && best == null) return 'explored';
      return best;
    }, null);
  }
  if (!EVIDENCE.has(combined.evidenceState)) combined.evidenceState = null;
  return combined;
}

function mergeSkills(current, incoming) {
  const out = { ...(current || {}) };
  for (const [skillId, skill] of Object.entries(incoming || {})) {
    if (!knownSkillId(skillId)) continue;
    if (!out[skillId]) {
      out[skillId] = skill;
      continue;
    }
    const have = out[skillId];
    if (have.invalidated) continue;
    if (skill.invalidated) continue;
  }
  return out;
}

export function resetProgress() {
  return emptyStore();
}

export function importProgress(payload, currentStore) {
  const checked = validateExport(payload);
  if (!checked.ok) return { ok: false, reason: checked.reason };
  const incoming = checked.bundle.store;
  const local = validateStore(currentStore || emptyStore());
  const base = local.ok ? local.store : emptyStore();
  const lessons = { ...base.lessons };
  for (const [lessonId, lesson] of Object.entries(incoming.lessons || {})) {
    lessons[lessonId] = mergeLesson(lessons[lessonId], lesson, lessonId);
  }
  const store = {
    schemaVersion: SCHEMA_VERSION,
    curriculumVersion: CURRICULUM_VERSION,
    skillCatalogVersion: SKILL_CATALOG_VERSION,
    session: base.session,
    skills: mergeSkills(base.skills, incoming.skills),
    lessons
  };
  const final = validateStore(store);
  if (!final.ok) return { ok: false, reason: final.reason || 'merge' };
  return { ok: true, store: final.store, repeated: true };
}
