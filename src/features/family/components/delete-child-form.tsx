'use client';

import { backingStorage, purgeChildData } from '@learn/learner-storage.js';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { Field } from '@/components/field';
import { FormMessage, SubmitButton } from '@/components/form-controls';
import { IDLE } from '@/lib/forms';
import { deleteChildAction } from '../actions';

/** Asks for the account password again. After the server deletes the learner, this browser's copy goes too. */
export function DeleteChildForm({ childId, nickname }: { childId: string; nickname: string }) {
  const router = useRouter();
  const [state, action] = useActionState(deleteChildAction, IDLE);

  useEffect(() => {
    if (state.status !== 'ok') return;
    purgeChildData(backingStorage(), childId);
    router.replace('/family?deleted=1');
  }, [state, childId, router]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage state={state.status === 'ok' ? IDLE : state} />
      <input type="hidden" name="childId" value={childId} />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="confirm" value="yes" required className="mt-0.5 size-5 shrink-0 accent-destructive" />
        <span>Permanently delete {nickname} and every saved practice try. This cannot be undone.</span>
      </label>
      <Field id="delete-child-password" name="password" label="Account password" type="password" autoComplete="current-password" required />
      <SubmitButton variant="destructive" className="w-fit" pendingLabel="Deleting…">
        Delete {nickname}
      </SubmitButton>
    </form>
  );
}
