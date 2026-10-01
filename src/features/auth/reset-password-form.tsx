'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Field } from '@/components/field';
import { Alert, Button } from '@/components/ui';
import { authClient } from '@/lib/auth/client';
import { authErrorMessage, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './messages';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get('password') ?? '');
    if (newPassword !== String(form.get('confirm') ?? '')) return setError('The two passwords do not match.');
    setPending(true);
    setError(null);
    const result = await authClient.resetPassword({ newPassword, token });
    if (result.error) {
      setPending(false);
      return setError(authErrorMessage(result.error, 'The password could not be changed. Ask for a new link.'));
    }
    router.push('/signin?reset=1');
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      <Field
        id="password"
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        hint="At least 10 characters. Changing it signs out every other device."
        required
      />
      <Field id="confirm" name="confirm" label="Confirm new password" type="password" autoComplete="new-password" required />
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save new password'}
      </Button>
    </form>
  );
}
