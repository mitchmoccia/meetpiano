import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeading, PageShell } from '@/components/page-shell';
import { Card } from '@/components/ui';
import { ChildForm } from '@/features/family/components/child-form';
import { requireParent } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Add a learner' };

export default async function NewChildPage() {
  await requireParent('/family/children/new');
  return (
    <PageShell width="narrow">
      <PageHeading title="Add a learner" eyebrow="Family">
        Learners do not get their own login. They pick their profile while you are signed in on the device.
      </PageHeading>
      <Card>
        <ChildForm mode="create" flow="family" />
      </Card>
      <Link className="w-fit text-sm font-bold underline underline-offset-4" href="/family">
        Back to the family dashboard
      </Link>
    </PageShell>
  );
}
