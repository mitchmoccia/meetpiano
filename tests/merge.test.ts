import { describe, expect, it } from 'vitest';
import type { AttemptDetails } from '@/features/progress/attempt-details';
import { canonicalJson, mergeAttempt } from '@/features/progress/merge';
import { ATTEMPT_DETAILS, storedAttempt } from './fixtures';

describe('mergeAttempt', () => {
  it('leaves an identical replay unchanged', () => {
    expect(mergeAttempt(storedAttempt(), storedAttempt())).toEqual({ kind: 'unchanged' });
  });

  it('compares details by content, not by key order', () => {
    const reordered = Object.fromEntries(Object.entries(ATTEMPT_DETAILS).reverse()) as AttemptDetails;
    expect(mergeAttempt(storedAttempt(), storedAttempt({ details: reordered }))).toEqual({ kind: 'unchanged' });
  });

  it('ignores a stale revision that went backwards', () => {
    const stale = storedAttempt({
      revision: 1,
      phase: 'guided',
      furthestPhase: 'guided',
      evidenceState: 'explored',
      completedAt: null,
      firstCompletedAt: null,
      lastActivityAt: new Date('2026-09-30T10:02:00Z')
    });
    expect(mergeAttempt(storedAttempt(), stale)).toEqual({ kind: 'unchanged' });
  });

  it('takes the current phase from a newer revision but never lowers evidence, furthest phase, or completion', () => {
    const newer = storedAttempt({
      revision: 3,
      phase: 'guided',
      furthestPhase: 'guided',
      evidenceState: 'explored',
      inputMode: 'midi',
      completedAt: null,
      firstCompletedAt: null,
      lastActivityAt: new Date('2026-09-30T10:09:00Z')
    });
    expect(mergeAttempt(storedAttempt(), newer)).toEqual({
      kind: 'update',
      record: storedAttempt({ revision: 3, phase: 'guided', inputMode: 'midi', lastActivityAt: new Date('2026-09-30T10:09:00Z') })
    });
  });

  it('moves the latest completion forward and keeps the first completion time', () => {
    const later = storedAttempt({
      revision: 3,
      evidenceState: 'independent',
      completedAt: new Date('2026-09-30T10:20:00Z'),
      firstCompletedAt: new Date('2026-09-30T10:20:00Z'),
      lastActivityAt: new Date('2026-09-30T10:20:00Z')
    });
    const outcome = mergeAttempt(storedAttempt(), later);
    expect(outcome).toMatchObject({
      kind: 'update',
      record: {
        evidenceState: 'independent',
        completedAt: new Date('2026-09-30T10:20:00Z'),
        firstCompletedAt: new Date('2026-09-30T10:05:00Z')
      }
    });
  });

  it('lets the later activity decide the current phase when revisions tie', () => {
    const outcome = mergeAttempt(storedAttempt(), storedAttempt({ phase: 'review', lastActivityAt: new Date('2026-09-30T10:06:00Z') }));
    expect(outcome).toMatchObject({ kind: 'update', record: { revision: 2, phase: 'review', furthestPhase: 'result' } });
  });

  it('refuses an attempt id that belongs to another learner', () => {
    expect(mergeAttempt(storedAttempt(), storedAttempt({ childId: 'child-b' }))).toEqual({ kind: 'conflict', reason: 'other-learner' });
  });

  it.each([
    ['lesson', { lessonId: 'L02' }],
    ['content version', { contentVersion: 'beginner-v2' }],
    ['source', { source: 'import' as const }],
    ['start time', { startedAt: new Date('2026-09-30T09:00:00Z') }]
  ])('refuses a resend that changes the %s of the attempt', (_field, change) => {
    expect(mergeAttempt(storedAttempt(), storedAttempt(change))).toEqual({ kind: 'conflict', reason: 'identity-changed' });
  });
});

describe('canonicalJson', () => {
  it('sorts object keys at every depth and keeps array order', () => {
    expect(canonicalJson({ b: 1, a: [{ d: 2, c: 3 }, 'x'] })).toBe('{"a":[{"c":3,"d":2},"x"],"b":1}');
  });
});
