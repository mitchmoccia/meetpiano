export const STORAGE_KEY = 'meetpiano:beginner-v1';
export const SCHEMA_VERSION = 2;
export const LEGACY_SCHEMA_VERSION = 1;
export const CURRICULUM_VERSION = 'beginner-v1';

export const PHASES = new Set(['explanation', 'demo', 'guided', 'independent', 'transfer', 'remediation', 'review', 'result']);
export const EVIDENCE = new Set(['explored', 'practiced', 'independent', 'retained']);
export const INPUT_MODES = new Set(['touch', 'computer-keys', 'midi', 'mixed']);
export const OCTAVE_POLICIES = new Set(['pitch-class', 'exact-pitch']);
export const PATTERN_IDS = new Set(['home', 'transfer', 'review', 'remediation', 'easier', 'passage']);
export const EVIDENCE_RANK = { explored: 1, practiced: 2, independent: 3, retained: 4 };

export function promoteEvidence(current, next) {
  if (!next || !EVIDENCE.has(next)) return current ?? null;
  if (!current || !EVIDENCE.has(current)) return next;
  return EVIDENCE_RANK[next] > EVIDENCE_RANK[current] ? next : current;
}

export function shouldGrantFirstCompletion(lesson) {
  return Boolean(lesson && (lesson.evidenceState === 'independent' || lesson.evidenceState === 'retained') && !lesson.firstCompletionRewarded);
}

export function isIsoDate(value) {
  return typeof value === 'string' && value.length >= 8 && !Number.isNaN(Date.parse(value));
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
