export const PAUSE_KEY = 'meetpiano:beginner-v1:pause';

function backend(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage || null;
  } catch (_) {
    return null;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function emptyPause() {
  return null;
}

export function validatePause(value) {
  if (!isPlainObject(value)) return null;
  if (typeof value.lessonId !== 'string' || !/^L\d{2}$/.test(value.lessonId)) return null;
  return {
    lessonId: value.lessonId,
    phase: typeof value.phase === 'string' ? value.phase : null,
    pausedAt: typeof value.pausedAt === 'string' ? value.pausedAt : null,
    takeWasLive: value.takeWasLive === true
  };
}

export function readPause(storage) {
  const local = backend(storage);
  if (!local) return null;
  try {
    const raw = local.getItem(PAUSE_KEY);
    if (!raw) return null;
    return validatePause(JSON.parse(raw));
  } catch (_) {
    return null;
  }
}

export function writePause(state, storage) {
  const local = backend(storage);
  const safe = validatePause({
    ...state,
    pausedAt: state?.pausedAt || new Date().toISOString()
  });
  if (!local || !safe) return null;
  try {
    local.setItem(PAUSE_KEY, JSON.stringify(safe));
    return safe;
  } catch (_) {
    return null;
  }
}

export function clearPause(storage) {
  const local = backend(storage);
  if (!local) return false;
  try {
    local.removeItem(PAUSE_KEY);
    return true;
  } catch (_) {
    return false;
  }
}

export function resumeHref(state) {
  const safe = validatePause(state);
  if (!safe) return '/learn/';
  return `/learn/?lesson=${safe.lessonId}&resume=1`;
}
