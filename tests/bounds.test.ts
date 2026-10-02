import { describe, expect, it } from 'vitest';
import { summaryBoundsProblem } from '@/features/progress/bounds';
import { SERVER_NOW, sentSummary } from './fixtures';

const minutesFromNow = (minutes: number) => new Date(SERVER_NOW + minutes * 60_000).toISOString();

describe('summaryBoundsProblem', () => {
  it('accepts a finished try that happened before the server clock', () => {
    expect(summaryBoundsProblem(sentSummary(), SERVER_NOW)).toBeNull();
  });

  it('allows a device clock up to five minutes ahead', () => {
    expect(summaryBoundsProblem(sentSummary({ completedAt: minutesFromNow(4), lastActivityAt: minutesFromNow(4) }), SERVER_NOW)).toBeNull();
  });

  it.each([
    ['startedAt', { startedAt: minutesFromNow(6), completedAt: null, lastActivityAt: minutesFromNow(6) }],
    ['lastActivityAt', { lastActivityAt: minutesFromNow(6) }],
    ['completedAt', { completedAt: minutesFromNow(6) }]
  ])('rejects %s more than five minutes ahead of the server', (_field, change) => {
    expect(summaryBoundsProblem(sentSummary(change), SERVER_NOW)).toBe('clock-ahead');
  });

  it('rejects tries said to start before 2025', () => {
    expect(summaryBoundsProblem(sentSummary({ startedAt: '2024-12-31T23:59:00Z' }), SERVER_NOW)).toBe('started-before-2025');
  });

  it('rejects activity before the start', () => {
    expect(summaryBoundsProblem(sentSummary({ completedAt: null, lastActivityAt: '2026-10-01T11:40:00Z' }), SERVER_NOW)).toBe('activity-before-start');
  });

  it('rejects completion before the start', () => {
    expect(summaryBoundsProblem(sentSummary({ completedAt: '2026-10-01T11:40:00Z' }), SERVER_NOW)).toBe('completed-before-start');
  });

  it.each(['independent', 'retained'] as const)('requires a completion time for %s evidence', (evidenceState) => {
    expect(summaryBoundsProblem(sentSummary({ evidenceState, completedAt: null }), SERVER_NOW)).toBe('mastery-needs-completion');
    expect(summaryBoundsProblem(sentSummary({ evidenceState }), SERVER_NOW)).toBeNull();
  });
});
