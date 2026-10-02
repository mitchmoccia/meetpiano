'use client';

import { flushBeforeSignOut } from '@learn/cloud-outbox.js';
import { backingStorage, clearLearnerCookie, purgeLearnerData } from '@learn/learner-storage.js';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { authClient } from '@/lib/auth/client';

type Stage = { kind: 'idle' } | { kind: 'working' } | { kind: 'confirm'; pending: number } | { kind: 'error' };

/**
 * Sends this account's waiting practice saves, asks before discarding any that could not be sent, then signs out and
 * removes this account's learner records from the browser so the next person cannot see or upload them.
 */
export function SignOutButton({ userId }: { userId: string }) {
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });

  async function finish() {
    setStage({ kind: 'working' });
    const result = await authClient.signOut();
    if (result.error) return setStage({ kind: 'error' });
    purgeLearnerData(backingStorage(), userId);
    clearLearnerCookie();
    window.location.replace('/signin?signedOut=1');
  }

  async function start() {
    setStage({ kind: 'working' });
    const pending = await flushBeforeSignOut({ userId });
    if (pending > 0) setStage({ kind: 'confirm', pending });
    else await finish();
  }

  if (stage.kind === 'confirm') {
    const tries = stage.pending === 1 ? '1 practice try has' : `${stage.pending} practice tries have`;
    return (
      <div role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border-[1.5px] border-destructive bg-white px-3 py-2 text-sm">
        <span>{tries} not reached MeetPiano yet. Signing out removes them from this browser.</span>
        <Button size="sm" variant="outline" onClick={() => setStage({ kind: 'idle' })}>
          Stay signed in
        </Button>
        <Button size="sm" variant="destructive" onClick={finish}>
          Sign out anyway
        </Button>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={start} disabled={stage.kind === 'working'}>
        {stage.kind === 'working' ? 'Signing out…' : 'Sign out'}
      </Button>
      {stage.kind === 'error' ? (
        <span role="alert" className="text-sm text-destructive">
          Could not sign out. Check the connection.
        </span>
      ) : null}
    </span>
  );
}
