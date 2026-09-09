import {
  CURRICULUM_VERSION,
  EVIDENCE,
  EVIDENCE_RANK,
  INPUT_MODES,
  LEGACY_SCHEMA_VERSION,
  OCTAVE_POLICIES,
  PATTERN_IDS,
  PHASES,
  SCHEMA_VERSION,
  STORAGE_KEY,
  isIsoDate,
  isPlainObject,
  promoteEvidence,
  shouldGrantFirstCompletion
} from './progress-core.js';
import { SESSION_GAP_MS, applyLessonOutcome, emptyEvidenceLanes, highestLane } from './evidence.js';
import { SKILL_CATALOG_VERSION, emptySkill, knownSkillId, skillIdsFor } from './skills.js';

export {
  CURRICULUM_VERSION,
  SCHEMA_VERSION,
  STORAGE_KEY,
  promoteEvidence,
  shouldGrantFirstCompletion
};

export function emptyStore() {
  return {
    schemaVersion: SCHEMA_VERSION,
    curriculumVersion: CURRICULUM_VERSION,
    skillCatalogVersion: SKILL_CATALOG_VERSION,
    session: null,
    skills: {},
    lessons: {}
  };
}

export function emptyLesson(lessonId) {
  return {
    lessonId,
    evidenceState: null,
    evidenceLanes: emptyEvidenceLanes(),
    currentAttemptId: null,
    firstCompletionRewarded: false,
    firstCompletedAt: null,
    attempts: []
  };
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

function sanitizeNoteList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => Number.isInteger(item)).slice(-16);
}

function sanitizeMistakeKinds(value) {
  if (!isPlainObject(value)) return {};
  const out = {};
  for (const [key, count] of Object.entries(value)) {
    if (typeof key === 'string' && Number.isInteger(count) && count > 0) out[key.slice(0, 40)] = count;
  }
  return out;
}

function sanitizeRestore(restore) {
  const src = isPlainObject(restore) ? restore : {};
  return {
    guidedStep: Number.isInteger(src.guidedStep) && src.guidedStep >= 0 ? src.guidedStep : 0,
    independentStep: Number.isInteger(src.independentStep) && src.independentStep >= 0 ? src.independentStep : 0,
    transferStep: Number.isInteger(src.transferStep) && src.transferStep >= 0 ? src.transferStep : 0,
    guidedTwoGroup: typeof src.guidedTwoGroup === 'string' ? src.guidedTwoGroup : null,
    hintsOn: src.hintsOn !== false,
    helped: src.helped === true,
    guidedC: Number.isInteger(src.guidedC) ? src.guidedC : null,
    lastC: Number.isInteger(src.lastC) ? src.lastC : null,
    sequence: sanitizeNoteList(src.sequence),
    heardTransfer: src.heardTransfer === true,
    homeDone: src.homeDone === true,
    independentStarted: src.independentStarted === true,
    reviewPausedAt: isIsoDate(src.reviewPausedAt) ? src.reviewPausedAt : null,
    reducedTempo: src.reducedTempo === true,
    mistakeKinds: sanitizeMistakeKinds(src.mistakeKinds),
    easierWork: src.easierWork === true,
    sessionCheck: src.sessionCheck === true,
    patternId: typeof src.patternId === 'string' && PATTERN_IDS.has(src.patternId) ? src.patternId : null
  };
}

function sanitizeSkillIds(value, lessonId) {
  const fallback = skillIdsFor(lessonId);
  if (!Array.isArray(value)) return fallback;
  const known = value.filter((id) => typeof id === 'string' && knownSkillId(id));
  return known.length ? known : fallback;
}

function sanitizeAssistance(value, restore) {
  const src = isPlainObject(value) ? value : {};
  return {
    hintsUsed: src.hintsUsed === true || restore.hintsOn === true || restore.helped === true,
    helpRequested: src.helpRequested === true || restore.helped === true,
    reducedTempo: src.reducedTempo === true || restore.reducedTempo === true
  };
}

function sanitizeLane(value) {
  if (!isPlainObject(value)) return null;
  if (typeof value.attemptId !== 'string' || !value.attemptId) return null;
  if (value.inputMode && !INPUT_MODES.has(value.inputMode)) return null;
  return {
    earnedAt: isIsoDate(value.earnedAt) ? value.earnedAt : null,
    attemptId: value.attemptId,
    inputMode: value.inputMode || 'touch',
    midiVerified: value.inputMode === 'midi' && value.midiVerified === true,
    assisted: value.assisted === true,
    patternId: typeof value.patternId === 'string' ? value.patternId : null,
    tempoBpm: Number.isFinite(value.tempoBpm) ? value.tempoBpm : null,
    skillVersion: typeof value.skillVersion === 'string' ? value.skillVersion : null,
    invalidated: value.invalidated === true
  };
}

function sanitizeLanes(value) {
  const src = isPlainObject(value) ? value : {};
  return {
    explored: sanitizeLane(src.explored),
    practiced: sanitizeLane(src.practiced),
    independent: sanitizeLane(src.independent),
    retained: sanitizeLane(src.retained)
  };
}

export function sanitizeInputDevice(value) {
  if (!isPlainObject(value)) return null;
  const id = typeof value.id === 'string' && value.id ? value.id.slice(0, 80) : null;
  const name = typeof value.name === 'string' && value.name ? value.name.slice(0, 80) : null;
  const manufacturer = typeof value.manufacturer === 'string' && value.manufacturer
    ? value.manufacturer.slice(0, 80)
    : null;
  if (!id && !name && !manufacturer) return null;
  return { id, name, manufacturer };
}

export function createAttempt(lessonId, extras = {}) {
  const id = globalThis.crypto?.randomUUID?.() || `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const restore = sanitizeRestore(extras.restore || {});
  if (extras.patternId && PATTERN_IDS.has(extras.patternId)) restore.patternId = extras.patternId;
  return {
    attemptId: id,
    lessonId,
    curriculumVersion: CURRICULUM_VERSION,
    skillIds: sanitizeSkillIds(extras.skillIds, lessonId),
    skillVersion: typeof extras.skillVersion === 'string' ? extras.skillVersion : CURRICULUM_VERSION,
    startedAt: new Date().toISOString(),
    completedAt: null,
    inputMode: extras.inputMode && INPUT_MODES.has(extras.inputMode) ? extras.inputMode : 'touch',
    inputDevice: sanitizeInputDevice(extras.inputDevice),
    audioUnlocked: false,
    phase: 'explanation',
    evidenceState: null,
    events: [],
    adultObserved: {},
    octavePolicyUsed: extras.octavePolicyUsed && OCTAVE_POLICIES.has(extras.octavePolicyUsed)
      ? extras.octavePolicyUsed
      : 'pitch-class',
    assistance: sanitizeAssistance(extras.assistance, restore),
    tempoBpm: Number.isFinite(extras.tempoBpm) ? extras.tempoBpm : null,
    patternId: extras.patternId && PATTERN_IDS.has(extras.patternId) ? extras.patternId : restore.patternId,
    sessionId: typeof extras.sessionId === 'string' ? extras.sessionId : null,
    exportable: true,
    restore
  };
}

export function validateAttempt(value, lessonId) {
  if (!isPlainObject(value)) return null;
  if (typeof value.attemptId !== 'string' || !value.attemptId) return null;
  if (value.lessonId !== lessonId) return null;
  if (typeof value.curriculumVersion !== 'string' || !value.curriculumVersion) return null;
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
  const events = Array.isArray(value.events) ? value.events.map(sanitizeEvent).filter(Boolean).slice(-80) : [];
  const restore = sanitizeRestore(value.restore);
  const historical = value.curriculumVersion !== CURRICULUM_VERSION;
  return {
    attemptId: value.attemptId,
    lessonId,
    curriculumVersion: value.curriculumVersion,
    skillIds: sanitizeSkillIds(value.skillIds, lessonId),
    skillVersion: typeof value.skillVersion === 'string' ? value.skillVersion : value.curriculumVersion,
    startedAt: value.startedAt,
    completedAt: value.completedAt,
    inputMode: value.inputMode,
    inputDevice: sanitizeInputDevice(value.inputDevice),
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
    assistance: sanitizeAssistance(value.assistance, restore),
    tempoBpm: Number.isFinite(value.tempoBpm) ? value.tempoBpm : null,
    patternId: value.patternId && PATTERN_IDS.has(value.patternId) ? value.patternId : restore.patternId,
    sessionId: typeof value.sessionId === 'string' ? value.sessionId : null,
    historical,
    exportable: true,
    restore
  };
}

function lanesFromAttempts(attempts, existing) {
  const lanes = sanitizeLanes(existing);
  for (const attempt of attempts) {
    if (!attempt.completedAt || attempt.historical) continue;
    const state = attempt.evidenceState;
    if (!state || !Object.prototype.hasOwnProperty.call(lanes, state)) continue;
    if (lanes[state]) continue;
    lanes[state] = sanitizeLane({
      earnedAt: attempt.completedAt,
      attemptId: attempt.attemptId,
      inputMode: attempt.inputMode,
      midiVerified: attempt.inputMode === 'midi',
      assisted: attempt.assistance?.helpRequested === true,
      patternId: attempt.patternId,
      tempoBpm: attempt.tempoBpm,
      skillVersion: attempt.skillVersion
    });
  }
  return lanes;
}

export function validateLesson(value, lessonId) {
  if (!isPlainObject(value)) return emptyLesson(lessonId);
  const attempts = Array.isArray(value.attempts)
    ? value.attempts.map((item) => validateAttempt(item, lessonId)).filter(Boolean).slice(-40)
    : [];
  const liveAttempts = attempts.filter((attempt) => !attempt.historical);
  let evidenceState = value.evidenceState == null ? null : value.evidenceState;
  if (evidenceState !== null && !EVIDENCE.has(evidenceState)) evidenceState = null;
  if (evidenceState === 'independent' || evidenceState === 'retained') {
    const earned = liveAttempts.some((attempt) => attempt.evidenceState === evidenceState && attempt.completedAt);
    if (!earned) {
      evidenceState = promoteEvidence(null, liveAttempts.reduce((best, attempt) => promoteEvidence(best, attempt.evidenceState), null));
    }
  }
  const evidenceLanes = lanesFromAttempts(liveAttempts, value.evidenceLanes);
  const fromLanes = highestLane(evidenceLanes);
  if (fromLanes) evidenceState = promoteEvidence(evidenceState, fromLanes);
  const currentAttemptId = typeof value.currentAttemptId === 'string' ? value.currentAttemptId : null;
  const knownCurrent = currentAttemptId && attempts.some((attempt) => attempt.attemptId === currentAttemptId)
    ? currentAttemptId
    : (attempts.find((attempt) => !attempt.completedAt)?.attemptId ?? null);
  return {
    lessonId,
    evidenceState,
    evidenceLanes,
    currentAttemptId: knownCurrent,
    firstCompletionRewarded: value.firstCompletionRewarded === true && Boolean(evidenceState && EVIDENCE_RANK[evidenceState] >= 3),
    firstCompletedAt: isIsoDate(value.firstCompletedAt) ? value.firstCompletedAt : null,
    attempts
  };
}

function sanitizeSkill(value, skillId) {
  const base = emptySkill(skillId);
  if (!isPlainObject(value)) return base;
  const lanes = sanitizeLanes(value.lanes);
  const live = value.invalidated === true ? highestLane(lanes) : (value.evidenceState && EVIDENCE.has(value.evidenceState) ? value.evidenceState : highestLane(lanes));
  return {
    skillId,
    skillVersion: typeof value.skillVersion === 'string' ? value.skillVersion : base.skillVersion,
    evidenceState: live,
    liveEvidenceState: highestLane(lanes),
    invalidated: value.invalidated === true,
    invalidReason: typeof value.invalidReason === 'string' ? value.invalidReason.slice(0, 80) : null,
    lanes
  };
}

function sanitizeSession(value) {
  if (!isPlainObject(value)) return null;
  if (typeof value.sessionId !== 'string' || !value.sessionId) return null;
  if (!isIsoDate(value.startedAt)) return null;
  return {
    sessionId: value.sessionId,
    startedAt: value.startedAt,
    lastSeenAt: isIsoDate(value.lastSeenAt) ? value.lastSeenAt : value.startedAt,
    isNew: value.isNew === true
  };
}

export function validateStore(value) {
  if (!isPlainObject(value)) return { ok: false, reason: 'not-object' };
  if (value.schemaVersion !== SCHEMA_VERSION && value.schemaVersion !== LEGACY_SCHEMA_VERSION) {
    return { ok: false, reason: 'schema' };
  }
  if (typeof value.curriculumVersion !== 'string' || !value.curriculumVersion) {
    return { ok: false, reason: 'curriculum' };
  }
  if (!isPlainObject(value.lessons)) return { ok: false, reason: 'lessons' };
  const lessons = {};
  for (const [lessonId, lesson] of Object.entries(value.lessons)) {
    if (typeof lessonId !== 'string' || !/^L\d{2}$/.test(lessonId)) continue;
    lessons[lessonId] = validateLesson(lesson, lessonId);
  }
  const skills = {};
  if (isPlainObject(value.skills)) {
    for (const [skillId, skill] of Object.entries(value.skills)) {
      if (!knownSkillId(skillId)) continue;
      skills[skillId] = sanitizeSkill(skill, skillId);
    }
  }
  return {
    ok: true,
    store: {
      schemaVersion: SCHEMA_VERSION,
      curriculumVersion: CURRICULUM_VERSION,
      skillCatalogVersion: typeof value.skillCatalogVersion === 'string' ? value.skillCatalogVersion : SKILL_CATALOG_VERSION,
      session: sanitizeSession(value.session),
      skills,
      lessons
    }
  };
}

export function mergeInputMode(current, next) {
  if (!INPUT_MODES.has(next)) return current || 'touch';
  if (!current || current === next) return next;
  return 'mixed';
}

function newSessionId() {
  return globalThis.crypto?.randomUUID?.() || `ses-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

  function touchSession(now = Date.now()) {
    const { store } = read();
    const last = store.session?.lastSeenAt;
    const lastMs = last ? Date.parse(last) : NaN;
    const gap = !last || Number.isNaN(lastMs) || (now - lastMs) >= SESSION_GAP_MS;
    const dayChanged = Boolean(last) && !Number.isNaN(lastMs)
      && new Date(lastMs).toDateString() !== new Date(now).toDateString();
    const isNew = gap || dayChanged || !store.session?.sessionId;
    if (isNew) {
      store.session = {
        sessionId: newSessionId(),
        startedAt: new Date(now).toISOString(),
        lastSeenAt: new Date(now).toISOString(),
        isNew: true
      };
    } else {
      store.session.lastSeenAt = new Date(now).toISOString();
      store.session.isNew = false;
    }
    write(store);
    return store.session;
  }

  function applyOutcome(lesson, attempt, requested) {
    const { store } = read();
    store.lessons[lesson.lessonId] = lesson;
    const granted = applyLessonOutcome(store, lesson, attempt, requested, store.session);
    write(store);
    return granted;
  }

  return { read, write, lessonState, saveLesson, touchSession, applyOutcome, memory };
}
