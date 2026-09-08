export const STORAGE_KEY = 'meetpiano:beginner-v1';
export const SCHEMA_VERSION = 1;
export const CURRICULUM_VERSION = 'beginner-v1';

const PHASES = new Set(['explanation', 'demo', 'guided', 'independent', 'transfer', 'remediation', 'review', 'result']);
const EVIDENCE = new Set(['explored', 'practiced', 'independent', 'retained']);
const INPUT_MODES = new Set(['touch', 'computer-keys', 'midi', 'mixed']);
const OCTAVE_POLICIES = new Set(['pitch-class', 'exact-pitch']);
const EVIDENCE_RANK = { explored: 1, practiced: 2, independent: 3, retained: 4 };

export function emptyStore() {
  return {
    schemaVersion: SCHEMA_VERSION,
    curriculumVersion: CURRICULUM_VERSION,
    lessons: {}
  };
}

export function emptyLesson(lessonId) {
  return {
    lessonId,
    evidenceState: null,
    currentAttemptId: null,
    firstCompletionRewarded: false,
    firstCompletedAt: null,
    attempts: []
  };
}

export function promoteEvidence(current, next) {
  if (!next || !EVIDENCE.has(next)) return current ?? null;
  if (!current || !EVIDENCE.has(current)) return next;
  return EVIDENCE_RANK[next] > EVIDENCE_RANK[current] ? next : current;
}

export function shouldGrantFirstCompletion(lesson) {
  return Boolean(lesson && lesson.evidenceState === 'independent' && !lesson.firstCompletionRewarded);
}

function isIsoDate(value) {
  return typeof value === 'string' && value.length >= 8 && !Number.isNaN(Date.parse(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeEvent(event) {
  if (!isPlainObject(event)) return null;
  const type = typeof event.type === 'string' ? event.type : '';
  if (!type) return null;
  return {
    t: event.t ?? null,
    type,
    expected: event.expected ?? null,
    heard: typeof event.heard === 'number' ? event.heard : null,
    match: typeof event.match === 'boolean' ? event.match : null
  };
}

function sanitizeRestore(restore) {
  const src = isPlainObject(restore) ? restore : {};
  return {
    guidedStep: Number.isInteger(src.guidedStep) && src.guidedStep >= 0 ? src.guidedStep : 0,
    independentStep: Number.isInteger(src.independentStep) && src.independentStep >= 0 ? src.independentStep : 0,
    transferStep: Number.isInteger(src.transferStep) && src.transferStep >= 0 ? src.transferStep : 0,
    guidedTwoGroup: typeof src.guidedTwoGroup === 'string' ? src.guidedTwoGroup : null,
    hintsOn: src.hintsOn !== false
  };
}

export function createAttempt(lessonId) {
  const id = globalThis.crypto?.randomUUID?.() || `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    attemptId: id,
    lessonId,
    curriculumVersion: CURRICULUM_VERSION,
    startedAt: new Date().toISOString(),
    completedAt: null,
    inputMode: 'touch',
    audioUnlocked: false,
    phase: 'explanation',
    evidenceState: null,
    events: [],
    adultObserved: {},
    octavePolicyUsed: 'pitch-class',
    exportable: true,
    restore: sanitizeRestore({})
  };
}

export function validateAttempt(value, lessonId) {
  if (!isPlainObject(value)) return null;
  if (typeof value.attemptId !== 'string' || !value.attemptId) return null;
  if (value.lessonId !== lessonId) return null;
  if (value.curriculumVersion !== CURRICULUM_VERSION) return null;
  if (!isIsoDate(value.startedAt)) return null;
  if (value.completedAt !== null && !isIsoDate(value.completedAt)) return null;
  if (!INPUT_MODES.has(value.inputMode)) return null;
  if (typeof value.audioUnlocked !== 'boolean') return null;
  if (!PHASES.has(value.phase)) return null;
  const evidenceState = value.evidenceState == null ? null : value.evidenceState;
  if (evidenceState !== null && !EVIDENCE.has(evidenceState)) return null;
  if (evidenceState === 'independent' && !value.completedAt) return null;
  if (value.exportable !== true) return null;
  if (value.octavePolicyUsed && !OCTAVE_POLICIES.has(value.octavePolicyUsed)) return null;
  const adult = isPlainObject(value.adultObserved) ? value.adultObserved : {};
  const events = Array.isArray(value.events) ? value.events.map(sanitizeEvent).filter(Boolean).slice(-40) : [];
  return {
    attemptId: value.attemptId,
    lessonId,
    curriculumVersion: CURRICULUM_VERSION,
    startedAt: value.startedAt,
    completedAt: value.completedAt,
    inputMode: value.inputMode,
    audioUnlocked: value.audioUnlocked,
    phase: value.phase,
    evidenceState,
    events,
    adultObserved: {
      posture: adult.posture === true,
      fingering: adult.fingering === true,
      note: typeof adult.note === 'string' ? adult.note.slice(0, 160) : undefined
    },
    octavePolicyUsed: value.octavePolicyUsed || 'pitch-class',
    exportable: true,
    restore: sanitizeRestore(value.restore)
  };
}

export function validateLesson(value, lessonId) {
  if (!isPlainObject(value)) return emptyLesson(lessonId);
  const attempts = Array.isArray(value.attempts)
    ? value.attempts.map((item) => validateAttempt(item, lessonId)).filter(Boolean).slice(-20)
    : [];
  let evidenceState = value.evidenceState == null ? null : value.evidenceState;
  if (evidenceState !== null && !EVIDENCE.has(evidenceState)) evidenceState = null;
  if (evidenceState === 'independent' || evidenceState === 'retained') {
    const earned = attempts.some((attempt) => attempt.evidenceState === evidenceState && attempt.completedAt);
    if (!earned) evidenceState = promoteEvidence(null, attempts.reduce((best, attempt) => promoteEvidence(best, attempt.evidenceState), null));
  }
  const currentAttemptId = typeof value.currentAttemptId === 'string' ? value.currentAttemptId : null;
  const knownCurrent = currentAttemptId && attempts.some((attempt) => attempt.attemptId === currentAttemptId)
    ? currentAttemptId
    : (attempts.find((attempt) => !attempt.completedAt)?.attemptId ?? null);
  return {
    lessonId,
    evidenceState,
    currentAttemptId: knownCurrent,
    firstCompletionRewarded: value.firstCompletionRewarded === true && Boolean(evidenceState && EVIDENCE_RANK[evidenceState] >= 3),
    firstCompletedAt: isIsoDate(value.firstCompletedAt) ? value.firstCompletedAt : null,
    attempts
  };
}

export function validateStore(value) {
  if (!isPlainObject(value)) return { ok: false, reason: 'not-object' };
  if (value.schemaVersion !== SCHEMA_VERSION) return { ok: false, reason: 'schema' };
  if (value.curriculumVersion !== CURRICULUM_VERSION) return { ok: false, reason: 'curriculum' };
  if (!isPlainObject(value.lessons)) return { ok: false, reason: 'lessons' };
  const lessons = {};
  for (const [lessonId, lesson] of Object.entries(value.lessons)) {
    if (typeof lessonId !== 'string' || !/^L\d{2}$/.test(lessonId)) continue;
    lessons[lessonId] = validateLesson(lesson, lessonId);
  }
  return {
    ok: true,
    store: {
      schemaVersion: SCHEMA_VERSION,
      curriculumVersion: CURRICULUM_VERSION,
      lessons
    }
  };
}

export function mergeInputMode(current, next) {
  if (!INPUT_MODES.has(next)) return current || 'touch';
  if (!current || current === next) return next;
  return 'mixed';
}

export function createProgress(storage) {
  const memory = { store: emptyStore(), notice: null, writable: true };

  function backend() {
    if (storage) return storage;
    try { return globalThis.localStorage; } catch (_) { return null; }
  }

  function read() {
    const local = backend();
    if (!local) {
      memory.notice = 'This browser is not saving progress. Nothing will be marked complete after a reload.';
      memory.writable = false;
      return memory;
    }
    let raw;
    try {
      raw = local.getItem(STORAGE_KEY);
    } catch (_) {
      memory.store = emptyStore();
      memory.notice = 'This browser blocked reading saved progress. Starting fresh — nothing was marked complete.';
      memory.writable = false;
      return memory;
    }
    if (!raw) {
      memory.store = emptyStore();
      memory.notice = null;
      memory.writable = true;
      return memory;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      memory.store = emptyStore();
      memory.notice = 'Saved progress looked damaged. Starting fresh — we did not mark anything complete.';
      memory.writable = true;
      return memory;
    }
    const checked = validateStore(parsed);
    if (!checked.ok) {
      memory.store = emptyStore();
      memory.notice = 'Saved progress could not be read. Starting fresh — we did not mark anything complete.';
      memory.writable = true;
      return memory;
    }
    memory.store = checked.store;
    memory.notice = null;
    memory.writable = true;
    return memory;
  }

  function write(store) {
    memory.store = store;
    const local = backend();
    if (!local || !memory.writable) return false;
    try {
      local.setItem(STORAGE_KEY, JSON.stringify(store));
      return true;
    } catch (_) {
      memory.notice = 'This browser blocked saving. Progress may not come back after reload.';
      memory.writable = false;
      return false;
    }
  }

  function lessonState(lessonId) {
    const { store } = read();
    if (!store.lessons[lessonId]) store.lessons[lessonId] = emptyLesson(lessonId);
    return store.lessons[lessonId];
  }

  function saveLesson(lessonId, lesson) {
    const { store } = read();
    store.lessons[lessonId] = lesson;
    write(store);
    return lesson;
  }

  return { read, write, lessonState, saveLesson, memory };
}
