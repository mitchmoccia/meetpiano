import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LocalDate } from '@/components/local-date';
import { PageHeading, PageShell } from '@/components/page-shell';
import { getDb } from '@/db/client';
import { writeAudit } from '@/features/admin/audit';
import { LearnerDetail } from '@/features/admin/components/learner-detail';
import { SyncEventTable } from '@/features/admin/components/sync-event-table';
import { requireAdmin } from '@/features/admin/guard';
import { familyDetail } from '@/features/admin/queries';

export const metadata: Metadata = { title: 'Family · Admin' };

type Params = Promise<{ familyId: string }>;

export default async function AdminFamilyPage({ params }: { params: Params }) {
  const admin = await requireAdmin();
  const { familyId } = await params;
  const db = getDb();
  const detail = await familyDetail(db, familyId);
  if (!detail) notFound();
  await writeAudit(db, { actor: admin, action: 'family.viewed', targetType: 'family', targetId: detail.owner.id });
  return (
    <PageShell>
      <PageHeading title={detail.owner.email} eyebrow="Pilot family · read-only">
        Joined <LocalDate value={detail.owner.createdAt.toISOString()} /> · {detail.owner.emailVerified ? 'email verified' : 'email not verified'} ·{' '}
        {detail.learners.length} {detail.learners.length === 1 ? 'learner' : 'learners'}
      </PageHeading>
      {detail.learners.length ? (
        detail.learners.map((learner) => <LearnerDetail key={learner.id} learner={learner} />)
      ) : (
        <p className="text-sm text-muted-foreground">No learners yet.</p>
      )}
      <section aria-labelledby="family-events" className="flex flex-col gap-2">
        <h2 id="family-events" className="text-xl font-extrabold">
          Save problems and imports
        </h2>
        <SyncEventTable events={detail.events} caption="Save problems and imports for this family" />
      </section>
      <Link prefetch={false} className="w-fit text-sm font-bold underline underline-offset-4" href="/admin/families">
        Back to pilot families
      </Link>
    </PageShell>
  );
}
