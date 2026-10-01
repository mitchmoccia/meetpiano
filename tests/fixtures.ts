import type { AttemptDetails, AttemptSummary } from '@/features/progress/attempt-details';
import type { AttemptRecord } from '@/features/progress/merge';

export const ATTEMPT_DETAILS: AttemptDetails = {
  skillVersion: 'beginner-v1',
  patternId: null,
  tempoBpm: null,
  octavePolicy: 'pitch-class',
  assistance: { hintsUsed: false, helpRequested: false, reducedTempo: false },
  adult: { posture: false, fingering: false, hand: false, listened: false, selfHeard: false, note: null },
  flags: {
    helped: false,
    hintsOn: false,
    sessionCheck: false,
    reviewPaused: false,
    dynamicsPassed: false,
    finishedThrough: false,
    notesPassed: true,
    rhythmPassed: false,
    velocityCapable: false
  }
};

/** A finished, practiced L01 try at revision 2. */
export function storedAttempt(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return {
    childId: 'child-a',
    lessonId: 'L01',
    contentVersion: 'beginner-v1',
    source: 'live',
    revision: 2,
    phase: 'result',
    furthestPhase: 'result',
    evidenceState: 'practiced',
    inputMode: 'touch',
    startedAt: new Date('2026-09-30T10:00:00Z'),
    completedAt: new Date('2026-09-30T10:05:00Z'),
    firstCompletedAt: new Date('2026-09-30T10:05:00Z'),
    lastActivityAt: new Date('2026-09-30T10:05:00Z'),
    details: ATTEMPT_DETAILS,
    ...overrides
  };
}

/** A finished, practiced L01 summary as a browser sends it, five minutes before the server's clock. */
export function sentSummary(overrides: Partial<AttemptSummary> = {}): AttemptSummary {
  return {
    clientAttemptId: 'attempt-0001',
    lessonId: 'L01',
    contentVersion: 'beginner-v1',
    revision: 1,
    phase: 'result',
    evidenceState: 'practiced',
    inputMode: 'touch',
    startedAt: '2026-10-01T11:50:00Z',
    completedAt: '2026-10-01T11:55:00Z',
    lastActivityAt: '2026-10-01T11:55:00Z',
    details: ATTEMPT_DETAILS,
    ...overrides
  };
}

export const SERVER_NOW = Date.parse('2026-10-01T12:00:00Z');
