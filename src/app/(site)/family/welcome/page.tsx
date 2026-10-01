import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageHeading, PageShell } from '@/components/page-shell';
import { Alert, Card, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { getDb } from '@/db/client';
import { ChildForm } from '@/features/family/components/child-form';
import { listChildren } from '@/features/family/service';
import { NextStep } from '@/features/progress/components/progress-sections';
import { childDashboard } from '@/features/progress/dashboard';
import { requireParent } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Welcome' };

const STEPS = ['Create a grown-up account', 'Add a learner', 'Play a first activity', 'See the saved progress here'];

function Steps({ current }: { current: number }) {
  return (
    <ol className="grid gap-2 text-sm sm:grid-cols-4">
      {STEPS.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? 'step' : undefined}
          className="rounded-lg border-[1.5px] border-border bg-white px-3 py-2 aria-[current=step]:border-primary aria-[current=step]:bg-secondary/60"
        >
          <span className="font-bold">{index + 1}.</span> {step}
          {index < current ? <span className="sr-only"> (done)</span> : null}
        </li>
      ))}
    </ol>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function WelcomePage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireParent('/family/welcome');
  const { child: childParam } = await searchParams;
  const db = getDb();
  const dashboard = typeof childParam === 'string' ? await childDashboard(db, session.userId, childParam) : null;
  if (!dashboard && (await listChildren(db, session.userId)).length) redirect('/family');
  return (
    <PageShell>
      <PageHeading title="Welcome to MeetPiano" eyebrow="Getting started">
        Each learner gets a profile inside your family. Their practice saves to MeetPiano while you are signed in.
      </PageHeading>
      <Steps current={dashboard ? 2 : 1} />
      {dashboard ? (
        <Card>
          <Alert variant="success">{dashboard.child.nickname} is ready to play.</Alert>
          <CardDescription>
            Hand the device to {dashboard.child.nickname}. When an activity finishes, come back to the family dashboard to see the saved try.
          </CardDescription>
          <NextStep childId={dashboard.child.id} nickname={dashboard.child.nickname} next={dashboard.next} />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Add your first learner</CardTitle>
            <CardDescription>Only a nickname is needed. You can add more learners later.</CardDescription>
          </CardHeader>
          <ChildForm mode="create" flow="welcome" />
        </Card>
      )}
    </PageShell>
  );
}
