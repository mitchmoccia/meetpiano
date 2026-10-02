import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LearnerAvatar } from '@/components/learner-avatar';
import { LocalDate } from '@/components/local-date';
import { PageHeading, PageShell } from '@/components/page-shell';
import { Alert, Card, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { getDb } from '@/db/client';
import { ChildForm } from '@/features/family/components/child-form';
import { DeleteChildForm } from '@/features/family/components/delete-child-form';
import { GuestImport } from '@/features/progress/components/guest-import';
import { EVIDENCE_NOTE, LessonList, NextStep, RecentActivity, SkillList } from '@/features/progress/components/progress-sections';
import { childDashboard } from '@/features/progress/dashboard';
import { requireParent } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Learner progress' };

type Params = Promise<{ childId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ChildPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { childId } = await params;
  const session = await requireParent(`/family/children/${childId}`);
  const dashboard = await childDashboard(getDb(), session.userId, childId);
  if (!dashboard) notFound();
  const { created } = await searchParams;
  const { child } = dashboard;
  return (
    <PageShell>
      <div className="flex items-center gap-4">
        <LearnerAvatar nickname={child.nickname} avatar={child.avatar} size="lg" />
        <PageHeading title={child.nickname} eyebrow="Learner">
          {dashboard.lastActivityAt ? (
            <>
              Last practice <LocalDate value={dashboard.lastActivityAt.toISOString()} withTime />
            </>
          ) : (
            'No practice saved yet.'
          )}
        </PageHeading>
      </div>
      {created === '1' ? <Alert variant="success">{child.nickname} was added.</Alert> : null}
      <NextStep childId={child.id} nickname={child.nickname} next={dashboard.next} />
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <RecentActivity attempts={dashboard.recent} />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
          <CardDescription>
            {dashboard.started} started · {dashboard.finished} finished
          </CardDescription>
        </CardHeader>
        <LessonList lessons={dashboard.lessons} />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Skill signals</CardTitle>
          <CardDescription>{EVIDENCE_NOTE}</CardDescription>
        </CardHeader>
        <SkillList skills={dashboard.skills} />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Guest practice on this browser</CardTitle>
          <CardDescription>
            If {child.nickname} practiced as a guest on this browser, you can copy those tries into {child.nickname}&apos;s saved
            progress. Nothing is copied until you confirm who practiced. Tries keep the results they had; nothing is upgraded.
            Importing again does not double count, and the guest records stay on this browser.
          </CardDescription>
        </CardHeader>
        <GuestImport childId={child.id} nickname={child.nickname} />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Edit {child.nickname}</CardTitle>
        </CardHeader>
        <ChildForm mode="edit" child={child} />
      </Card>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Delete {child.nickname}</CardTitle>
          <CardDescription>Removes this learner and all of their saved tries from MeetPiano and from this browser.</CardDescription>
        </CardHeader>
        <DeleteChildForm childId={child.id} nickname={child.nickname} />
      </Card>
      <Link className="w-fit text-sm font-bold underline underline-offset-4" href="/family">
        Back to the family dashboard
      </Link>
    </PageShell>
  );
}
