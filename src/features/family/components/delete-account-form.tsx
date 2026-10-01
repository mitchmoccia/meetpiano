'use client';

import { backingStorage, clearLearnerCookie, purgeLearnerData } from '@learn/learner-storage.js';
import { useActionState, useEffect } from 'react';
import { Field } from '@/components/field';
import { FormMessage, SubmitButton } from '@/components/form-controls';
import { IDLE } from '@/lib/forms';
import { deleteAccountAction } from '../actions';

/** Asks for the account password and the word DELETE, then clears this account's learner records from the browser. */
export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccountAction, IDLE);

  useEffect(() => {
    if (state.status !== 'ok' || !state.userId) return;
    purgeLearnerData(backingStorage(), state.userId);
    clearLearnerCookie();
    window.location.replace('/signin?deleted=1');
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage state={state.status === 'ok' ? IDLE : state} />
      <Field
        id="delete-account-confirm"
        name="confirmText"
        label="Type DELETE to confirm"
        autoComplete="off"
        hint="Deletes the account, every learner profile, and all saved practice."
        required
      />
      <Field id="delete-account-password" name="password" label="Account password" type="password" autoComplete="current-password" required />
      <SubmitButton variant="destructive" className="w-fit" pendingLabel="Deleting…">
        Delete account and family data
      </SubmitButton>
    </form>
  );
}
