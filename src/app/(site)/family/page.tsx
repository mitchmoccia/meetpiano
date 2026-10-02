import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeading, PageShell } from '@/components/page-shell';
import { Alert, buttonVariants } from '@/components/ui';
import { getDb } from '@/db/client';
import { ChildCard } from '@/features/family/components/child-card';
import { MAX_CHILDREN } from '@/features/family/validation';
import { EVIDENCE_NOTE } from '@/features/progress/components/progress-sections';
import { familyOverview } from '@/features/progress/dashboard';
import { requireParent } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Family' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FamilyPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireParent('/family');
  const entries = await familyOverview(getDb(), session.userId);
  if (!entries.length) redirect('/family/welcome');
  const { deleted } = await searchParams;
  return (
    <PageShell>
      <PageHeading title="Your family" eyebrow="Family dashboard">
        Pick up where each learner left off, or open their saved progress.
      </PageHeading>
      {deleted === '1' ? <Alert variant="success">The learner and every saved try for them were deleted.</Alert> : null}
      <ul className="flex flex-col gap-4">
        {entries.map((entry) => (
          <li key={entry.child.id}>
            <ChildCard entry={entry} />
          </li>
        ))}
      </ul>
      {entries.length < MAX_CHILDREN ? (
        <Link className={buttonVariants({ variant: 'outline', className: 'w-fit' })} href="/family/children/new">
          Add a learner
        </Link>
      ) : (
        <p className="text-sm text-muted-foreground">A family can have up to {MAX_CHILDREN} learners.</p>
      )}
      <p className="text-sm text-muted-foreground">{EVIDENCE_NOTE}</p>
    </PageShell>
  );
}
