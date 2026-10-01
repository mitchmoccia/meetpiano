import { attemptSummary, summaryFingerprint, withRememberedCompletion } from './cloud-summary.js';
import {
  backingStorage,
  emptySyncRecord,
  pendingForUser,
  purgeChildData,
  readLearnerCookie,
  readProgressSnapshot,
  readSyncRecord,
  scopedStorage,
  userSyncRecords,
  writeSyncRecord
} from './learner-storage.js';

const ATTEMPTS_URL = '/api/learner/attempts';
const BATCH_SIZE = 20;
const MAX_QUEUE = 300;
const MAX_FAILED = 50;
const MAX_ROUNDS = 10;
const SCAN_DELAY_MS = 300;
const RETRY_MIN_MS = 2_000;
const RETRY_MAX_MS = 60_000;
const REQUEST_TIMEOUT_MS = 15_000;
const LOCK_NAME = 'meetpiano-learner-outbox';
const BLOCKING = new Set(['signed-out', 'other-account']);

/** A queued completion is never replaced by a later revision without one, so a finish cannot be lost before it is sent. */
function enqueue(queue, summary) {
  const index = queue.findIndex((item) => item.clientAttemptId === summary.clientAttemptId);
  if (index >= 0 && !(queue[index].completedAt && !summary.completedAt)) queue[index] = summary;
  else queue.push(summary);
  while (queue.length > MAX_QUEUE) {
    const drop = queue.findIndex((item) => !item.completedAt);
    queue.splice(drop >= 0 ? drop : 0, 1);
  }
}

function queueIfChanged(record, base) {
  const entry = record.ledger[base.clientAttemptId] || { r: 0, h: null, c: null };
  const summary = withRememberedCompletion(base, entry.c);
  if (summary.completedAt) entry.c = summary.completedAt;
  record.ledger[base.clientAttemptId] = entry;
  const fingerprint = summaryFingerprint(summary);
  if (fingerprint === entry.h) return;
  entry.r += 1;
  entry.h = fingerprint;
  enqueue(record.queue, { ...summary, revision: entry.r });
}

/** Queues a new revision for every local attempt whose checkpoint changed since it was last queued. */
export function scanAttempts(record, store) {
  const seen = new Set();
  for (const lesson of Object.values(store?.lessons || {})) {
    for (const attempt of lesson?.attempts || []) {
      if (attempt?.origin === 'cloud') continue;
      const base = attemptSummary(attempt);
      if (!base) continue;
      seen.add(base.clientAttemptId);
      queueIfChanged(record, base);
    }
  }
  for (const id of Object.keys(record.ledger)) {
    if (!seen.has(id) && !record.queue.some((item) => item.clientAttemptId === id)) delete record.ledger[id];
  }
  return record;
}

function settle(record, sent, result) {
  const { clientAttemptId, revision } = sent.attempt;
  record.queue = record.queue.filter((item) => item.clientAttemptId !== clientAttemptId || item.revision > revision);
  if (result.status === 'saved' || result.status === 'unchanged') {
    const entry = record.ledger[clientAttemptId];
    if (entry && Number.isInteger(result.revision)) entry.r = Math.max(entry.r, result.revision);
    return;
  }
  record.failed.push({
    clientAttemptId,
    lessonId: sent.attempt.lessonId,
    revision,
    reason: typeof result.reason === 'string' ? result.reason.slice(0, 80) : result.status,
    at: new Date().toISOString()
  });
  record.failed = record.failed.slice(-MAX_FAILED);
}

/** Applies server results to each learner's own record; results arrive in the order the entries were sent. */
export function applyResults(backing, entries, results) {
  const records = new Map();
  entries.forEach((sent, index) => {
    const record = records.get(sent.childId) ?? readSyncRecord(backing, sent.childId);
    if (!record) return;
    records.set(sent.childId, record);
    settle(record, sent, results[index]);
  });
  for (const record of records.values()) writeSyncRecord(backing, record);
}

function resultsMatch(body, entries) {
  return Array.isArray(body?.results)
    && body.results.length === entries.length
    && body.results.every((result, index) => result?.clientAttemptId === entries[index].attempt.clientAttemptId);
}

function withLock(fn) {
  const locks = globalThis.navigator?.locks;
  return typeof locks?.request === 'function' ? locks.request(LOCK_NAME, fn) : fn();
}

function statusKind(transport, pending, failed) {
  if (BLOCKING.has(transport)) return transport;
  if (pending) return ['offline', 'retrying', 'waiting'].includes(transport) ? transport : 'saving';
  return failed ? 'failed' : 'saved';
}

/**
 * Sends bounded attempt summaries for one parent account. Every entry keeps the child it was recorded for, so a
 * profile switch never re-labels a pending save, and a 401 or account mismatch stops sending until the page reloads.
 */
export function createOutbox({
  userId,
  childId = null,
  backing = backingStorage(),
  fetchImpl = (...args) => globalThis.fetch(...args),
  onStatus = () => {},
  requireLearnerCookie = true
}) {
  const state = { transport: 'idle', sending: false, again: false, retryMs: RETRY_MIN_MS, retryTimer: null, scanTimer: null };

  function emit() {
    const record = childId ? readSyncRecord(backing, childId) : null;
    const pending = record?.queue.length ?? 0;
    const failed = record?.failed.length ?? 0;
    onStatus({ kind: statusKind(state.transport, pending, failed), pending, failed });
  }

  function setTransport(next) {
    state.transport = next;
    emit();
  }

  function scanNow() {
    clearTimeout(state.scanTimer);
    if (!childId) return;
    const record = readSyncRecord(backing, childId) ?? emptySyncRecord(userId, childId);
    const store = readProgressSnapshot(backing, childId);
    if (record.userId !== userId || !store) return;
    writeSyncRecord(backing, scanAttempts(record, store));
    emit();
  }

  function noteChange() {
    clearTimeout(state.scanTimer);
    state.scanTimer = setTimeout(() => {
      scanNow();
      flush();
    }, SCAN_DELAY_MS);
  }

  function scheduleRetry() {
    if (state.retryTimer) return;
    state.retryTimer = setTimeout(() => {
      state.retryTimer = null;
      flush();
    }, state.retryMs);
    state.retryMs = Math.min(state.retryMs * 2, RETRY_MAX_MS);
  }

  /** Sending waits while the learner cookie on this browser points outside this account, as after signing in as someone else. */
  function maySend() {
    if (!requireLearnerCookie) return true;
    const active = readLearnerCookie();
    return Boolean(active) && userSyncRecords(backing, userId).some((record) => record.childId === active);
  }

  function nextBatch() {
    const entries = [];
    for (const record of userSyncRecords(backing, userId)) {
      for (const attempt of record.queue) {
        if (entries.length >= BATCH_SIZE) return entries;
        entries.push({ childId: record.childId, attempt });
      }
    }
    return entries;
  }

  function request(entries, keepalive) {
    const timeout = keepalive ? undefined : globalThis.AbortSignal?.timeout?.(REQUEST_TIMEOUT_MS);
    return fetchImpl(ATTEMPTS_URL, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      keepalive,
      signal: timeout,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, entries })
    });
  }

  function markBatchFailed(entries, reason) {
    applyResults(backing, entries, entries.map((sent) => ({ clientAttemptId: sent.attempt.clientAttemptId, status: 'rejected', reason })));
  }

  async function sendBatch(entries, keepalive) {
    let response;
    try {
      response = await request(entries, keepalive);
    } catch (_) {
      setTransport(globalThis.navigator?.onLine === false ? 'offline' : 'retrying');
      scheduleRetry();
      return 'retry';
    }
    if (response.status === 401) return (setTransport('signed-out'), 'blocked');
    if (response.status === 409) return (setTransport('other-account'), 'blocked');
    if (response.status === 429 || response.status >= 500) return (setTransport('retrying'), scheduleRetry(), 'retry');
    if (!response.ok) return (markBatchFailed(entries, `http-${response.status}`), 'sent');
    const body = await response.json().catch(() => null);
    if (!resultsMatch(body, entries)) return (setTransport('retrying'), scheduleRetry(), 'retry');
    applyResults(backing, entries, body.results);
    state.retryMs = RETRY_MIN_MS;
    return 'sent';
  }

  async function drain() {
    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      const entries = nextBatch();
      if (!entries.length) return setTransport('idle');
      setTransport('sending');
      if ((await sendBatch(entries, false)) !== 'sent') return;
    }
  }

  async function flush({ keepalive = false } = {}) {
    if (BLOCKING.has(state.transport)) return;
    if (!maySend()) return (setTransport('waiting'), scheduleRetry());
    if (keepalive) {
      const entries = nextBatch();
      if (entries.length) sendBatch(entries, true);
      return;
    }
    if (state.sending) {
      state.again = true;
      return;
    }
    state.sending = true;
    try {
      await withLock(drain);
    } finally {
      state.sending = false;
      emit();
      if (state.again) {
        state.again = false;
        flush();
      }
    }
  }

  function flushOnExit() {
    scanNow();
    flush({ keepalive: true });
  }

  function start(win = globalThis.window) {
    win?.addEventListener('online', () => {
      state.retryMs = RETRY_MIN_MS;
      flush();
    });
    win?.addEventListener('pagehide', flushOnExit);
    win?.document?.addEventListener('visibilitychange', () => {
      if (win.document.visibilityState === 'hidden') flushOnExit();
    });
    scanNow();
    return flush();
  }

  if (childId) {
    const existing = readSyncRecord(backing, childId);
    if (existing && existing.userId !== userId) purgeChildData(backing, childId);
    if (!existing || existing.userId !== userId) writeSyncRecord(backing, emptySyncRecord(userId, childId));
  }

  return {
    storage: childId ? scopedStorage(backing, childId, noteChange) : null,
    start,
    scanNow,
    flush,
    flushOnExit,
    status: emit
  };
}

/** Sends what this browser still holds for one parent before sign-out. Resolves to the number of saves still waiting. */
export async function flushBeforeSignOut({ userId, backing = backingStorage(), fetchImpl, timeoutMs = 6_000 }) {
  const outbox = createOutbox({ userId, backing, fetchImpl, requireLearnerCookie: false });
  let timer;
  await Promise.race([outbox.flush(), new Promise((resolve) => { timer = setTimeout(resolve, timeoutMs); })]);
  clearTimeout(timer);
  return pendingForUser(backing, userId);
}
