import Link from 'next/link';
import { LearnerAvatar } from '@/components/learner-avatar';
import { LocalDate } from '@/components/local-date';
import { Card, CardTitle } from '@/components/ui';
import type { FamilyOverviewEntry } from '@/features/progress/dashboard';
import { NextStep } from '@/features/progress/components/progress-sections';

function ActivityLine({ entry }: { entry: FamilyOverviewEntry }) {
  if (!entry.lastActivityAt) return <p className="text-sm text-muted-foreground">No practice saved yet.</p>;
  return (
    <p className="text-sm text-muted-foreground">
      {entry.started} {entry.started === 1 ? 'activity' : 'activities'} started · {entry.finished} finished · Last practice{' '}
      <LocalDate value={entry.lastActivityAt.toISOString()} />
    </p>
  );
}

export function ChildCard({ entry }: { entry: FamilyOverviewEntry }) {
  const { child } = entry;
  return (
    <Card aria-labelledby={`child-${child.id}`}>
      <div className="flex items-center gap-3">
        <LearnerAvatar nickname={child.nickname} avatar={child.avatar} size="lg" />
        <div className="flex flex-col gap-1">
          <CardTitle id={`child-${child.id}`}>{child.nickname}</CardTitle>
          <ActivityLine entry={entry} />
        </div>
      </div>
      <NextStep childId={child.id} nickname={child.nickname} next={entry.next} />
      <Link className="w-fit font-bold underline underline-offset-4" href={`/family/children/${child.id}`}>
        Progress and settings for {child.nickname}
      </Link>
    </Card>
  );
}
