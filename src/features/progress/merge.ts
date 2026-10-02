import {
  evidenceRank,
  PHASE_RANK,
  type AttemptDetails,
  type AttemptSource,
  type AttemptSummary,
  type EvidenceState,
  type InputMode,
  type Phase
} from './attempt-details';

export type AttemptRecord = {
  childId: string;
  lessonId: string;
  contentVersion: string;
  source: AttemptSource;
  revision: number;
  phase: Phase;
  furthestPhase: Phase;
  evidenceState: EvidenceState | null;
  inputMode: InputMode;
  startedAt: Date;
  completedAt: Date | null;
  firstCompletedAt: Date | null;
  lastActivityAt: Date;
  details: AttemptDetails;
};

export type MergeOutcome =
  | { kind: 'conflict'; reason: 'other-learner' | 'identity-changed' }
  | { kind: 'unchanged' }
  | { kind: 'update'; record: AttemptRecord };

export function attemptFromSummary(childId: string, summary: AttemptSummary, source: AttemptSource): AttemptRecord {
  const completedAt = summary.completedAt ? new Date(summary.completedAt) : null;
  return {
    childId,
    lessonId: summary.lessonId,
    contentVersion: summary.contentVersion,
    source,
    revision: summary.revision,
    phase: summary.phase,
    furthestPhase: summary.phase,
    evidenceState: summary.evidenceState,
    inputMode: summary.inputMode,
    startedAt: new Date(summary.startedAt),
    completedAt,
    firstCompletedAt: completedAt,
    lastActivityAt: new Date(summary.lastActivityAt),
    details: summary.details
  };
}

function pickDate(a: Date | null, b: Date | null, later: boolean): Date | null {
  if (!a || !b) return a ?? b;
  return (later ? b.getTime() > a.getTime() : b.getTime() < a.getTime()) ? b : a;
}

function sameTime(a: Date | null, b: Date | null): boolean {
  return (a?.getTime() ?? null) === (b?.getTime() ?? null);
}

/** JSON with sorted keys, because jsonb returns object keys in its own order. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sameRecord(a: AttemptRecord, b: AttemptRecord): boolean {
  return (
    a.revision === b.revision &&
    a.phase === b.phase &&
    a.furthestPhase === b.furthestPhase &&
    a.evidenceState === b.evidenceState &&
    a.inputMode === b.inputMode &&
    sameTime(a.completedAt, b.completedAt) &&
    sameTime(a.firstCompletedAt, b.firstCompletedAt) &&
    sameTime(a.lastActivityAt, b.lastActivityAt) &&
    canonicalJson(a.details) === canonicalJson(b.details)
  );
}

function sameIdentity(a: AttemptRecord, b: AttemptRecord): boolean {
  return (
    a.lessonId === b.lessonId &&
    a.contentVersion === b.contentVersion &&
    a.source === b.source &&
    a.startedAt.getTime() === b.startedAt.getTime()
  );
}

function isNewer(existing: AttemptRecord, incoming: AttemptRecord): boolean {
  if (incoming.revision !== existing.revision) return incoming.revision > existing.revision;
  return incoming.lastActivityAt.getTime() > existing.lastActivityAt.getTime();
}

/**
 * Folds a resent, retried, or reordered revision into the stored attempt. The newest revision decides the current
 * phase and details, while the furthest phase, strongest evidence, and completion times only ever move forward.
 */
export function mergeAttempt(existing: AttemptRecord, incoming: AttemptRecord): MergeOutcome {
  if (existing.childId !== incoming.childId) return { kind: 'conflict', reason: 'other-learner' };
  if (!sameIdentity(existing, incoming)) return { kind: 'conflict', reason: 'identity-changed' };
  const current = isNewer(existing, incoming) ? incoming : existing;
  const record: AttemptRecord = {
    ...existing,
    revision: Math.max(existing.revision, incoming.revision),
    phase: current.phase,
    inputMode: current.inputMode,
    details: current.details,
    furthestPhase: PHASE_RANK[incoming.furthestPhase] > PHASE_RANK[existing.furthestPhase] ? incoming.furthestPhase : existing.furthestPhase,
    evidenceState: evidenceRank(incoming.evidenceState) > evidenceRank(existing.evidenceState) ? incoming.evidenceState : existing.evidenceState,
    completedAt: pickDate(existing.completedAt, incoming.completedAt, true),
    firstCompletedAt: pickDate(existing.firstCompletedAt, incoming.firstCompletedAt, false),
    lastActivityAt: pickDate(existing.lastActivityAt, incoming.lastActivityAt, true) ?? existing.lastActivityAt
  };
  return sameRecord(existing, record) ? { kind: 'unchanged' } : { kind: 'update', record };
}
