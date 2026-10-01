import type { Metadata } from 'next';
import { PageHeading, PageShell } from '@/components/page-shell';
import { getDb } from '@/db/client';
import { requireAdmin } from '@/features/admin/guard';
import { adminOverview } from '@/features/admin/queries';

export const metadata: Metadata = { title: 'Admin' };

const STATS = [
  ['families', 'Families'],
  ['learners', 'Learners'],
  ['attemptsThisWeek', 'Tries active in the last 7 days'],
  ['completedThisWeek', 'Finished tries in the last 7 days'],
  ['problemsThisWeek', 'Save problems in the last 7 days'],
  ['pausedLessons', 'Paused lessons']
] as const;

export default async function AdminPage() {
  await requireAdmin();
  const overview = await adminOverview(getDb());
  return (
    <PageShell>
      <PageHeading title="Admin" eyebrow="MeetPiano operations">
        Pilot overview. Lesson changes and family views are recorded in the audit log.
      </PageHeading>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STATS.map(([key, label]) => (
          <div key={key} className="rounded-lg border-[1.5px] border-border bg-white p-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-3xl font-extrabold">{overview[key]}</dd>
          </div>
        ))}
      </dl>
    </PageShell>
  );
}
