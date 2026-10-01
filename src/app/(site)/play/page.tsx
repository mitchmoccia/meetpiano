import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageHeading, PageShell } from '@/components/page-shell';
import { Alert } from '@/components/ui';
import { getDb } from '@/db/client';
import { listChildren } from '@/features/family/service';
import { GuestChoice, LearnerPicker } from '@/features/learner/components/learner-picker';
import { requireParent } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Who is playing?' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PlayPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireParent('/play');
  const learners = await listChildren(getDb(), session.userId);
  if (!learners.length) redirect('/family/welcome');
  const { reason } = await searchParams;
  return (
    <PageShell>
      <PageHeading title="Who is playing?" eyebrow="Play">
        Practice saves to the learner you pick. Switch learners here at any time.
      </PageHeading>
      {reason === 'choose' ? <Alert variant="info">Pick who is playing so practice saves to the right learner.</Alert> : null}
      <LearnerPicker learners={learners} />
      <GuestChoice />
    </PageShell>
  );
}
