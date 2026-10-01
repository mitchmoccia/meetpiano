import 'server-only';
import type { LearnerStore } from '@learn/progress.js';
import { recommendNext } from '@learn/recommend.js';
import { SKILL_CATALOG } from '@learn/skills.js';
import { withLessonAvailability } from '@learn/unit.js';
import { eq, inArray } from 'drizzle-orm';
import type { Database } from '@/db/client';
import { lessonProgress } from '@/db/schema';
import { lessonTitle } from '@/features/curriculum/catalog';
import { availabilityFrom, readLessonSettings, type CatalogAvailability, type LessonSetting } from '@/features/curriculum/settings';
import { findOwnedChild, listChildren, type ChildSummary } from '@/features/family/service';
import type { EvidenceState } from './attempt-details';
import { deriveStore, loadAttemptHistory, type HistoryRow } from './history';

type ProgressRow = typeof lessonProgress.$inferSelect;

export type NextLesson = { lessonId: string; title: string; href: string; kind: 'start' | 'keep-going' | 'later-check' | 'replay' };

export type ChildProgressSummary = { started: number; finished: number; lastActivityAt: Date | null; next: NextLesson };

export type LessonProgressView = {
  lessonId: string;
  title: string;
  evidenceState: EvidenceState | null;
  attemptCount: number;
  completedAttemptCount: number;
  importedAttemptCount: number;
  lastActivityAt: Date | null;
};

export type RecentAttempt = Pick<HistoryRow, 'clientAttemptId' | 'lessonId' | 'evidenceState' | 'inputMode' | 'source' | 'lastActivityAt'> & {
  title: string;
  completed: boolean;
};

export type SkillIndicator = { skillId: string; title: string; evidenceState: string };

export type ChildDashboard = ChildProgressSummary & {
  child: ChildSummary;
  lessons: LessonProgressView[];
  recent: RecentAttempt[];
  skills: SkillIndicator[];
};

export type FamilyOverviewEntry = ChildProgressSummary & { child: ChildSummary };

function nextLesson(store: LearnerStore, availability: CatalogAvailability): NextLesson {
  const pick = withLessonAvailability(availability, () => recommendNext(store, null));
  const started = Boolean(store.lessons[pick.lessonId]?.evidenceState);
  const kind = pick.kind === 'rest' ? 'replay' : pick.kind === 'review-when-ready' ? 'later-check' : started ? 'keep-going' : 'start';
  return { lessonId: pick.lessonId, title: pick.title, href: pick.href, kind };
}

function summarize(rows: ProgressRow[], store: LearnerStore, availability: CatalogAvailability): ChildProgressSummary {
  const times = rows.map((row) => row.lastActivityAt?.getTime() ?? 0).filter(Boolean);
  return {
    started: rows.filter((row) => row.attemptCount > 0).length,
    finished: rows.filter((row) => row.completedAttemptCount > 0).length,
    lastActivityAt: times.length ? new Date(Math.max(...times)) : null,
    next: nextLesson(store, availability)
  };
}

function titleLookup(settings: LessonSetting[]): (lessonId: string) => string {
  const titles = new Map(settings.map((lesson) => [lesson.id, lesson.title]));
  return (lessonId) => titles.get(lessonId) ?? lessonTitle(lessonId);
}

function lessonViews(rows: ProgressRow[], settings: LessonSetting[], title: (id: string) => string): LessonProgressView[] {
  const order = new Map(settings.map((lesson, index) => [lesson.id, index]));
  return [...rows]
    .sort((a, b) => (order.get(a.lessonId) ?? 999) - (order.get(b.lessonId) ?? 999))
    .map((row) => ({
      lessonId: row.lessonId,
      title: title(row.lessonId),
      evidenceState: row.evidenceState,
      attemptCount: row.attemptCount,
      completedAttemptCount: row.completedAttemptCount,
      importedAttemptCount: row.importedAttemptCount,
      lastActivityAt: row.lastActivityAt
    }));
}

function recentAttempts(history: HistoryRow[], title: (id: string) => string): RecentAttempt[] {
  return [...history]
    .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
    .slice(0, 10)
    .map((row) => ({
      clientAttemptId: row.clientAttemptId,
      lessonId: row.lessonId,
      title: title(row.lessonId),
      evidenceState: row.evidenceState,
      inputMode: row.inputMode,
      source: row.source,
      lastActivityAt: row.lastActivityAt,
      completed: row.completedAt !== null
    }));
}

function skillIndicators(store: LearnerStore): SkillIndicator[] {
  return Object.values(store.skills)
    .filter((skill) => skill.evidenceState)
    .map((skill) => ({ skillId: skill.skillId, title: SKILL_CATALOG[skill.skillId]?.title ?? skill.skillId, evidenceState: skill.evidenceState ?? '' }));
}

/** One learner's saved progress for the parent dashboard, or null when the child is not in this parent's family. */
export async function childDashboard(db: Database, userId: string, childId: string): Promise<ChildDashboard | null> {
  const child = await findOwnedChild(db, userId, childId);
  if (!child) return null;
  const [settings, rows, history] = await Promise.all([
    readLessonSettings(db),
    db.select().from(lessonProgress).where(eq(lessonProgress.childId, child.id)),
    loadAttemptHistory(db, child.id)
  ]);
  const store = deriveStore(history);
  const title = titleLookup(settings);
  return {
    child,
    ...summarize(rows, store, availabilityFrom(settings)),
    lessons: lessonViews(rows, settings, title),
    recent: recentAttempts(history.recent, title),
    skills: skillIndicators(store)
  };
}

export async function familyOverview(db: Database, userId: string): Promise<FamilyOverviewEntry[]> {
  const children = await listChildren(db, userId);
  if (!children.length) return [];
  const ids = children.map((child) => child.id);
  const [settings, rows] = await Promise.all([
    readLessonSettings(db),
    db.select().from(lessonProgress).where(inArray(lessonProgress.childId, ids))
  ]);
  const availability = availabilityFrom(settings);
  return Promise.all(
    children.map(async (child) => {
      const history = await loadAttemptHistory(db, child.id);
      return { child, ...summarize(rows.filter((row) => row.childId === child.id), deriveStore(history), availability) };
    })
  );
}
