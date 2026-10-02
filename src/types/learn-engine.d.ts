/**
 * Types for the browser lesson engine in public/js. The engine stays plain JavaScript so the static /learn page keeps
 * working without a build step; these declarations cover only the parts the Next.js app imports.
 */

declare module '@learn/progress.js' {
  export type EvidenceState = 'explored' | 'practiced' | 'independent' | 'retained';
  export type EvidenceLane = { earnedAt: string | null; attemptId: string; inputMode: string; assisted: boolean } | null;
  export type EvidenceLanes = Record<'explored' | 'practiced' | 'independent' | 'retained', EvidenceLane>;
  export type EngineAttempt = {
    attemptId: string;
    lessonId: string;
    curriculumVersion: string;
    startedAt: string;
    completedAt: string | null;
    phase: string;
    evidenceState: EvidenceState | null;
    inputMode: string;
    historical?: boolean;
    origin?: 'cloud';
  };
  export type EngineLesson = {
    lessonId: string;
    evidenceState: EvidenceState | null;
    evidenceLanes: EvidenceLanes;
    currentAttemptId: string | null;
    firstCompletionRewarded: boolean;
    firstCompletedAt: string | null;
    attempts: EngineAttempt[];
  };
  export type EngineSkill = { skillId: string; evidenceState: EvidenceState | null; lanes: EvidenceLanes };
  export type LearnerStore = {
    schemaVersion: number;
    curriculumVersion: string;
    skillCatalogVersion: string;
    session: unknown;
    skills: Record<string, EngineSkill>;
    lessons: Record<string, EngineLesson>;
  };
  export const STORAGE_KEY: string;
  export function emptyStore(): LearnerStore;
  export function validateStore(value: unknown): { ok: true; store: LearnerStore } | { ok: false; reason: string };
}

declare module '@learn/unit.js' {
  import type { LearnerStore } from '@learn/progress.js';
  export type LessonCard = {
    lessonId: string;
    title: string;
    blurb: string;
    unlocksAfter: string | null;
    unlockNeeds: 'practiced' | 'independent' | null;
    unitId: string;
  };
  export type LessonAvailability = { paused?: string[]; order?: Record<string, number> };
  export const CURRICULUM_VERSION: string;
  export const JOURNEY_LESSONS: readonly LessonCard[];
  export function unitView(store: LearnerStore): { units: Array<{ unitId: string; title: string; cards: LessonCard[] }> };
  export function withLessonAvailability<T>(settings: LessonAvailability, fn: () => T): T;
}

declare module '@learn/recommend.js' {
  import type { LearnerStore } from '@learn/progress.js';
  export type Recommendation = {
    kind: 'easier' | 'continue' | 'review-transfer' | 'forward' | 'review-when-ready' | 'rest';
    lessonId: string;
    title: string;
    reason: string;
    href: string;
    action: string;
  };
  export function recommendNext(store: LearnerStore, session?: unknown): Recommendation;
}

declare module '@learn/skills.js' {
  export const SKILL_CATALOG: Record<string, { title: string; version: string; lessonId: string; adultObserved?: string }>;
}

declare module '@learn/cloud-summary.js' {
  import type { EngineAttempt } from '@learn/progress.js';
  export type CloudSummary = {
    clientAttemptId: string;
    lessonId: string;
    contentVersion: string;
    phase: string;
    evidenceState: string | null;
    inputMode: string;
    startedAt: string;
    completedAt: string | null;
    lastActivityAt: string;
    details: Record<string, unknown>;
  };
  export function summaryProblem(attempt: EngineAttempt): string | null;
  export function attemptSummary(attempt: EngineAttempt): CloudSummary | null;
}

declare module '@learn/cloud-merge.js' {
  import type { EvidenceLanes, EvidenceState, LearnerStore } from '@learn/progress.js';
  export type CloudAttemptRow = {
    clientAttemptId: string;
    lessonId: string;
    contentVersion: string;
    phase: string;
    evidenceState: string | null;
    inputMode: string;
    startedAt: string;
    completedAt: string | null;
    firstCompletedAt: string | null;
    details: unknown;
  };
  export type CloudProgressView = {
    lessons: Record<string, { evidenceState: EvidenceState | null; evidenceLanes: EvidenceLanes; firstCompletionRewarded: boolean; firstCompletedAt: string | null }>;
    skills: Record<string, { lanes: EvidenceLanes; evidenceState: EvidenceState | null }>;
  };
  export function deriveStoreFromAttempts(rows: CloudAttemptRow[]): LearnerStore;
  export function cloudProgressView(store: LearnerStore): CloudProgressView;
}

declare module '@learn/learner-storage.js' {
  export type LearnerBacking = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;
  export function backingStorage(): LearnerBacking;
  export function clearLearnerCookie(doc?: Document): void;
  export function pendingForUser(backing: LearnerBacking, userId: string): number;
  export function purgeChildData(backing: LearnerBacking, childId: string): void;
  export function purgeLearnerData(backing: LearnerBacking, userId: string): void;
}

declare module '@learn/cloud-outbox.js' {
  import type { LearnerBacking } from '@learn/learner-storage.js';
  export function flushBeforeSignOut(options: { userId: string; backing?: LearnerBacking; timeoutMs?: number }): Promise<number>;
}
