'use client';

import { PageHeading, PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageShell width="narrow">
      <PageHeading title="Something went wrong" eyebrow="MeetPiano">
        The page could not load. Nothing you saved is lost. Try again in a moment.
      </PageHeading>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <a href="/family">Family dashboard</a>
        </Button>
      </div>
    </PageShell>
  );
}
