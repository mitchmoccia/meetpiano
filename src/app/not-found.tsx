import { PageHeading, PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <PageShell width="narrow">
      <PageHeading title="Page not found" eyebrow="MeetPiano">
        This page does not exist, or it is not available to this account.
      </PageHeading>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <a href="/family">Family dashboard</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/learn/">Lesson journey</a>
        </Button>
      </div>
    </PageShell>
  );
}
