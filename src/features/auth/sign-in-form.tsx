'use client';

import { useState, type FormEvent } from 'react';
import { Field } from '@/components/field';
import { Alert, Button } from '@/components/ui';
import { authClient } from '@/lib/auth/client';
import { authErrorMessage, PENDING_EMAIL_KEY } from './messages';

/** On success the auth client follows the callback URL, which confirms the session and returns to the safe next path. */
export function SignInForm({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    setPending(true);
    setError(null);
    const result = await authClient.signIn.email({
      email,
      password: String(form.get('password') ?? ''),
      callbackURL: `/verify?next=${encodeURIComponent(next)}`
    });
    if (!result.error) return;
    setPending(false);
    if (result.error.code === 'EMAIL_NOT_VERIFIED') sessionStorage.setItem(PENDING_EMAIL_KEY, email);
    setError(authErrorMessage(result.error, 'Sign-in did not work. Try again.'));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      <Field id="email" name="email" label="Email" type="email" autoComplete="email" required />
      <Field id="password" name="password" label="Password" type="password" autoComplete="current-password" required />
      <Button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
