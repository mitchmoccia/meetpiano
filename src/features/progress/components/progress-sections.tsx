import { EvidenceBadge } from '@/components/evidence-badge';
import { LocalDate } from '@/components/local-date';
import { Badge } from '@/components/ui';
import { PracticeButton } from '@/features/learner/components/practice-button';
import type { LessonProgressView, NextLesson, RecentAttempt, SkillIndicator } from '../dashboard';

export const EVIDENCE_NOTE =
  "These are practice records from the lesson player: what the app saw during practice on this learner's tries. They are not a teacher's assessment or a grade.";

const INPUT_LABELS: Record<string, string> = {
  touch: 'Touch screen',
  'computer-keys': 'Computer keys',
  midi: 'MIDI keyboard',
  mixed: 'Mixed input'
};

const NEXT_COPY: Record<NextLesson['kind'], (title: string) => { heading: string; action: string }> = {
  start: (title) => ({ heading: `Next up: ${title}`, action: `Start ${title}` }),
  'keep-going': (title) => ({ heading: `Keep going with ${title}`, action: `Continue ${title}` }),
  'later-check': (title) => ({ heading: `Ready for a later check: ${title}`, action: 'Open the later check' }),
  replay: () => ({ heading: 'Nothing new is waiting right now', action: 'Open the journey' })
};

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function NextStep({ childId, nickname, next }: { childId: string; nickname: string; next: NextLesson }) {
  const copy = NEXT_COPY[next.kind](next.title);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-[1.5px] border-primary bg-secondary/60 px-4 py-3">
      <p className="font-semibold">{copy.heading}</p>
      <PracticeButton childId={childId} next={next.href} label={copy.action} ariaLabel={`${copy.action} as ${nickname}`} />
    </div>
  );
}

export function RecentActivity({ attempts }: { attempts: RecentAttempt[] }) {
  if (!attempts.length) {
    return <p className="text-sm text-muted-foreground">No saved tries yet. Tries appear here once practice reaches a checkpoint.</p>;
  }
  return (
    <ol className="flex flex-col divide-y divide-border">
      {attempts.map((attempt) => (
        <li key={attempt.clientAttemptId} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
          <div className="flex flex-col">
            <span className="font-semibold">
              {attempt.lessonId} · {attempt.title}
            </span>
            <span className="text-sm text-muted-foreground">
              <LocalDate value={attempt.lastActivityAt.toISOString()} withTime /> · {INPUT_LABELS[attempt.inputMode] ?? attempt.inputMode}
              {attempt.source === 'import' ? ' · Imported from guest practice' : ''}
            </span>
          </div>
          {attempt.completed ? <EvidenceBadge state={attempt.evidenceState} /> : <Badge variant="muted">Not finished</Badge>}
        </li>
      ))}
    </ol>
  );
}

function triesText(lesson: LessonProgressView): string {
  const parts = [plural(lesson.attemptCount, 'try', 'tries'), `${lesson.completedAttemptCount} finished`];
  if (lesson.importedAttemptCount) parts.push(`${lesson.importedAttemptCount} imported`);
  return parts.join(' · ');
}

export function LessonList({ lessons }: { lessons: LessonProgressView[] }) {
  if (!lessons.length) return <p className="text-sm text-muted-foreground">No activities started yet.</p>;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {lessons.map((lesson) => (
        <li key={lesson.lessonId} className="flex items-center justify-between gap-3 rounded-lg border-[1.5px] border-border bg-white px-3 py-2">
          <div className="flex flex-col">
            <span className="font-semibold">
              {lesson.lessonId} · {lesson.title}
            </span>
            <span className="text-xs text-muted-foreground">{triesText(lesson)}</span>
          </div>
          <EvidenceBadge state={lesson.evidenceState} />
        </li>
      ))}
    </ul>
  );
}

export function SkillList({ skills }: { skills: SkillIndicator[] }) {
  if (!skills.length) return <p className="text-sm text-muted-foreground">No skill signals yet. They appear after finished tries.</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <li key={skill.skillId} className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-border bg-white px-3 py-1.5 text-sm">
          {skill.title}
          <EvidenceBadge state={skill.evidenceState} />
        </li>
      ))}
    </ul>
  );
}
