import type { Metadata } from 'next';
import { PageHeading, PageShell } from '@/components/page-shell';
import { getDb } from '@/db/client';
import { SyncEventTable } from '@/features/admin/components/sync-event-table';
import { requireAdmin } from '@/features/admin/guard';
import { recentSyncEvents } from '@/features/admin/queries';

export const metadata: Metadata = { title: 'Save problems · Admin' };

const REASONS = [
  ['unknown-learner', 'The learner is not in the signed-in family, or was deleted before the save arrived.'],
  ['unknown-lesson-version', 'The lesson or content version is not in the curriculum tables. Run the curriculum sync after a lesson release.'],
  ['invalid-summary:<field>', 'The browser sent a summary that failed validation at that field, usually an outdated lesson page.'],
  ['clock-ahead · started-before-2025', "The device clock is far off, so the try's times were not trusted."],
  ['activity-before-start · completed-before-start', 'The try reported times out of order.'],
  ['mastery-needs-completion', 'The try claimed Independent or Retained without finishing.'],
  ['other-learner · identity-changed · duplicate-attempt-id', 'A try id already belongs to another learner or another start; the stored try was kept.']
] as const;

export default async function SavesPage() {
  await requireAdmin();
  const events = await recentSyncEvents(getDb());
  return (
    <PageShell>
      <PageHeading title="Save problems" eyebrow="Admin">
        The latest 100 rejected or conflicting saves and guest imports. Tries are never edited from here.
      </PageHeading>
      <SyncEventTable events={events} caption="Latest save problems and imports" />
      <section aria-labelledby="reasons" className="flex flex-col gap-2">
        <h2 id="reasons" className="text-xl font-extrabold">
          What the reasons mean
        </h2>
        <dl className="flex flex-col gap-2 text-sm">
          {REASONS.map(([reason, meaning]) => (
            <div key={reason}>
              <dt className="font-mono font-bold">{reason}</dt>
              <dd className="text-muted-foreground">{meaning}</dd>
            </div>
          ))}
        </dl>
      </section>
    </PageShell>
  );
}
