import type { AttemptSummary } from './attempt-details';

const MAX_CLOCK_SKEW_MS = 5 * 60_000;
const EARLIEST_ATTEMPT_MS = Date.parse('2025-01-01T00:00:00Z');

/** Why a well-formed summary still cannot be stored, judged against the server clock, or null when it can. */
export function summaryBoundsProblem(summary: AttemptSummary, now: number): string | null {
  const started = Date.parse(summary.startedAt);
  const activity = Date.parse(summary.lastActivityAt);
  const completed = summary.completedAt ? Date.parse(summary.completedAt) : null;
  const latest = now + MAX_CLOCK_SKEW_MS;
  if (started < EARLIEST_ATTEMPT_MS) return 'started-before-2025';
  if (started > latest || activity > latest || (completed !== null && completed > latest)) return 'clock-ahead';
  if (activity < started) return 'activity-before-start';
  if (completed !== null && completed < started) return 'completed-before-start';
  const mastery = summary.evidenceState === 'independent' || summary.evidenceState === 'retained';
  if (mastery && completed === null) return 'mastery-needs-completion';
  return null;
}
