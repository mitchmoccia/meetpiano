import { STORAGE_KEY } from './progress-core.js';
import { PAUSE_KEY } from './session-pause.js';

export const LEARNER_COOKIE = 'mp_learner';
const PREFIX = 'meetpiano:learner:v1:';
export const CONTEXT_CACHE_KEY = `${PREFIX}context`;
const CHILD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SYNC_KEY = /^meetpiano:learner:v1:([0-9a-f-]{36}):sync$/i;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

export function isChildId(value) {
  return typeof value === 'string' && CHILD_ID.test(value);
}

/** The learner choice made on /play. It names a profile; the server still checks that it belongs to the signed-in parent. */
export function readLearnerCookie(doc = globalThis.document) {
  const pair = String(doc?.cookie || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LEARNER_COOKIE}=`));
  if (!pair) return null;
  try {
    const value = decodeURIComponent(pair.slice(LEARNER_COOKIE.length + 1));
    return isChildId(value) ? value.toLowerCase() : null;
  } catch (_) {
    return null;
  }
}

export function clearLearnerCookie(doc = globalThis.document) {
  if (!doc) return;
  const secure = globalThis.location?.protocol === 'https:' ? '; Secure' : '';
  doc.cookie = `${LEARNER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function learnerKey(childId, part) {
  return `${PREFIX}${childId}:${part}`;
}

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
    key: (index) => [...map.keys()][index] ?? null,
    get length() { return map.size; }
  };
}

let fallback = null;

/** localStorage when the browser allows it; otherwise an in-memory stand-in so a signed-in learner can still save this visit. */
export function backingStorage() {
  try {
    const local = globalThis.localStorage;
    const probe = `${PREFIX}probe`;
    local.setItem(probe, '1');
    local.removeItem(probe);
    return local;
  } catch (_) {
    fallback ??= memoryStorage();
    return fallback;
  }
}

/** The engine's progress and pause keys, redirected into one learner's namespace. Any other key is a programming error. */
export function scopedStorage(backing, childId, onProgressWrite) {
  const keys = new Map([
    [STORAGE_KEY, learnerKey(childId, 'progress')],
    [PAUSE_KEY, learnerKey(childId, 'pause')]
  ]);
  const target = (key) => {
    const mapped = keys.get(key);
    if (!mapped) throw new Error(`Learner storage does not hold ${key}`);
    return mapped;
  };
  return {
    getItem: (key) => backing.getItem(target(key)),
    setItem: (key, value) => {
      backing.setItem(target(key), value);
      if (key === STORAGE_KEY) onProgressWrite?.();
    },
    removeItem: (key) => backing.removeItem(target(key))
  };
}

export function emptySyncRecord(userId, childId) {
  return { userId, childId, ledger: {}, queue: [], failed: [] };
}

export function readSyncRecord(backing, childId) {
  const value = parseJson(backing.getItem(learnerKey(childId, 'sync')));
  if (!isObject(value) || typeof value.userId !== 'string' || value.childId !== childId) return null;
  return {
    userId: value.userId,
    childId,
    ledger: isObject(value.ledger) ? value.ledger : {},
    queue: Array.isArray(value.queue) ? value.queue : [],
    failed: Array.isArray(value.failed) ? value.failed : []
  };
}

/** Returns false when the browser refuses the write (for example, storage is full); callers report that as unsaved. */
export function writeSyncRecord(backing, record) {
  try {
    backing.setItem(learnerKey(record.childId, 'sync'), JSON.stringify(record));
    return true;
  } catch (_) {
    return false;
  }
}

export function readProgressSnapshot(backing, childId) {
  const value = parseJson(backing.getItem(learnerKey(childId, 'progress')));
  return isObject(value) && isObject(value.lessons) ? value : null;
}

function childIdsInStorage(backing) {
  const ids = [];
  for (let index = 0; index < backing.length; index += 1) {
    const match = SYNC_KEY.exec(backing.key(index) || '');
    if (match) ids.push(match[1]);
  }
  return ids;
}

/** Sync records tagged with this parent account. Records from any other account are never read for sending. */
export function userSyncRecords(backing, userId) {
  return childIdsInStorage(backing)
    .map((childId) => readSyncRecord(backing, childId))
    .filter((record) => record?.userId === userId);
}

export function pendingForUser(backing, userId) {
  return userSyncRecords(backing, userId).reduce((sum, record) => sum + record.queue.length, 0);
}

export function purgeChildData(backing, childId) {
  for (const part of ['progress', 'pause', 'sync']) backing.removeItem(learnerKey(childId, part));
}

export function readContextCache(backing) {
  const value = parseJson(backing.getItem(CONTEXT_CACHE_KEY));
  return isObject(value) && typeof value.userId === 'string' && isChildId(value.child?.id) ? value : null;
}

/** Keeps who is practicing and the lesson catalog for offline visits. Progress itself lives in the learner namespace. */
export function writeContextCache(backing, { userId, child, catalog }) {
  try {
    backing.setItem(CONTEXT_CACHE_KEY, JSON.stringify({ userId, child, catalog, cachedAt: new Date().toISOString() }));
    return true;
  } catch (_) {
    return false;
  }
}

/** Removes every learner namespace and the cached context that belong to one parent account on this browser. */
export function purgeLearnerData(backing, userId) {
  for (const record of userSyncRecords(backing, userId)) purgeChildData(backing, record.childId);
  if (readContextCache(backing)?.userId === userId) backing.removeItem(CONTEXT_CACHE_KEY);
}
