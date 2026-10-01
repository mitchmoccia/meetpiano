import { z } from 'zod';

export const PHASES = ['explanation', 'demo', 'guided', 'independent', 'transfer', 'remediation', 'review', 'result'] as const;
export const EVIDENCE_STATES = ['explored', 'practiced', 'independent', 'retained'] as const;
export const INPUT_MODES = ['touch', 'computer-keys', 'midi', 'mixed'] as const;
export const PATTERN_IDS = ['home', 'transfer', 'review', 'remediation', 'easier', 'passage'] as const;
export const OCTAVE_POLICIES = ['pitch-class', 'exact-pitch'] as const;
export const ADULT_NOTES = ['adult-confirmed-other-c', 'adult-confirmed-other-two-group'] as const;

export type Phase = (typeof PHASES)[number];
export type EvidenceState = (typeof EVIDENCE_STATES)[number];
export type InputMode = (typeof INPUT_MODES)[number];
export type AttemptSource = 'live' | 'import';

export const CONTENT_VERSION_PATTERN = /^[a-z0-9][a-z0-9.-]{0,39}$/;
export const CLIENT_ATTEMPT_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
export const LESSON_ID_PATTERN = /^L\d{2}$/;

const flag = z.boolean();

export const attemptDetailsSchema = z.strictObject({
  skillVersion: z.string().regex(CONTENT_VERSION_PATTERN),
  patternId: z.enum(PATTERN_IDS).nullable(),
  tempoBpm: z.number().min(20).max(320).nullable(),
  octavePolicy: z.enum(OCTAVE_POLICIES),
  assistance: z.strictObject({ hintsUsed: flag, helpRequested: flag, reducedTempo: flag }),
  adult: z.strictObject({
    posture: flag,
    fingering: flag,
    hand: flag,
    listened: flag,
    selfHeard: flag,
    note: z.enum(ADULT_NOTES).nullable()
  }),
  flags: z.strictObject({
    helped: flag,
    hintsOn: flag,
    sessionCheck: flag,
    reviewPaused: flag,
    dynamicsPassed: flag,
    finishedThrough: flag,
    notesPassed: flag,
    rhythmPassed: flag,
    velocityCapable: flag
  })
});

export type AttemptDetails = z.infer<typeof attemptDetailsSchema>;

const isoTimestamp = z.iso.datetime({ offset: true });

export const attemptSummarySchema = z.strictObject({
  clientAttemptId: z.string().regex(CLIENT_ATTEMPT_ID_PATTERN),
  lessonId: z.string().regex(LESSON_ID_PATTERN),
  contentVersion: z.string().regex(CONTENT_VERSION_PATTERN),
  revision: z.number().int().min(1).max(100000),
  phase: z.enum(PHASES),
  evidenceState: z.enum(EVIDENCE_STATES).nullable(),
  inputMode: z.enum(INPUT_MODES),
  startedAt: isoTimestamp,
  completedAt: isoTimestamp.nullable(),
  lastActivityAt: isoTimestamp,
  details: attemptDetailsSchema
});

export type AttemptSummary = z.infer<typeof attemptSummarySchema>;

export const EVIDENCE_RANK: Record<EvidenceState, number> = {
  explored: 1,
  practiced: 2,
  independent: 3,
  retained: 4
};

export const PHASE_RANK: Record<Phase, number> = {
  explanation: 0,
  demo: 1,
  guided: 2,
  remediation: 2,
  independent: 3,
  review: 3,
  transfer: 4,
  result: 5
};

export function evidenceRank(state: EvidenceState | null | undefined): number {
  return state ? EVIDENCE_RANK[state] : 0;
}
