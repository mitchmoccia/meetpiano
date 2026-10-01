import type { Metadata } from 'next';
import { PageHeading, PageShell } from '@/components/page-shell';
import { Alert, Badge } from '@/components/ui';
import { getDb } from '@/db/client';
import { LessonMoveButtons, LessonStatusForm } from '@/features/admin/components/lesson-controls';
import { Table, Td, Th } from '@/features/admin/components/table';
import { requireAdmin } from '@/features/admin/guard';
import { lessonActivity } from '@/features/admin/queries';
import { readLessonSettings, type LessonSetting } from '@/features/curriculum/settings';

export const metadata: Metadata = { title: 'Curriculum · Admin' };

const DONE: Record<string, string> = { status: 'Status saved.', moved: 'Order saved.', unchanged: 'Nothing changed.' };
const ERRORS: Record<string, string> = {
  invalid: 'That change was not valid. Notes can be up to 200 characters.',
  'unknown-lesson': 'That lesson does not exist.',
  'rate-limited': 'Too many changes in a minute. Wait and try again.'
};

type Activity = Awaited<ReturnType<typeof lessonActivity>>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function groupByUnit(settings: LessonSetting[]) {
  const units = new Map<string, { id: string; title: string; lessons: LessonSetting[] }>();
  for (const lesson of settings) {
    const unit = units.get(lesson.unitId) ?? { id: lesson.unitId, title: lesson.unitTitle, lessons: [] };
    unit.lessons.push(lesson);
    units.set(lesson.unitId, unit);
  }
  return [...units.values()];
}

function activityText(activity: Activity, lessonId: string): string {
  const tries = activity.tries.get(lessonId);
  const problems = activity.problems.get(lessonId) ?? 0;
  const parts = [`${tries?.started ?? 0} tries`, `${tries?.completed ?? 0} finished`, `${tries?.learners ?? 0} learners`];
  return `${parts.join(' · ')}${problems ? ` · ${problems} save problems` : ''}`;
}

function Notice({ done, error }: { done: unknown; error: unknown }) {
  if (typeof error === 'string') return <Alert variant="destructive">{ERRORS[error] ?? 'That change failed.'}</Alert>;
  if (typeof done === 'string' && DONE[done]) return <Alert variant="success">{DONE[done]}</Alert>;
  return null;
}

export default async function CurriculumPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const db = getDb();
  const [settings, activity] = await Promise.all([readLessonSettings(db), lessonActivity(db)]);
  const { done, error } = await searchParams;
  return (
    <PageShell>
      <PageHeading title="Curriculum" eyebrow="Admin">
        Lesson content and unlock rules live in the lesson code. Here you can pause a lesson or change its order inside its unit for
        family learners. Guest practice uses the order in the code and is never paused.
      </PageHeading>
      <Notice done={done} error={error} />
      {groupByUnit(settings).map((unit) => (
        <section key={unit.id} aria-labelledby={`unit-${unit.id}`} className="flex flex-col gap-2">
          <h2 id={`unit-${unit.id}`} className="text-xl font-extrabold">
            {unit.title}
          </h2>
          <Table caption={`${unit.title} lessons`}>
            <thead>
              <tr>
                <Th>Lesson</Th>
                <Th>Order</Th>
                <Th>Last 30 days</Th>
                <Th>Availability</Th>
              </tr>
            </thead>
            <tbody>
              {unit.lessons.map((lesson, index) => (
                <tr key={lesson.id} id={`lesson-${lesson.id}`}>
                  <Td>
                    <span className="font-bold">{lesson.id}</span> {lesson.title}{' '}
                    {lesson.status === 'paused' ? <Badge variant="destructive">Paused</Badge> : null}
                    <div className="text-xs text-muted-foreground">Content version {lesson.currentContentVersion}</div>
                  </Td>
                  <Td>
                    <LessonMoveButtons lesson={lesson} first={index === 0} last={index === unit.lessons.length - 1} />
                  </Td>
                  <Td className="text-muted-foreground">{activityText(activity, lesson.id)}</Td>
                  <Td>
                    <LessonStatusForm lesson={lesson} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      ))}
    </PageShell>
  );
}
