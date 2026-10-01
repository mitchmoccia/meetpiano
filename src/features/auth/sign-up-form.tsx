'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Field } from '@/components/field';
import { Alert, Button } from '@/components/ui';
import { authClient } from '@/lib/auth/client';
import { authErrorMessage, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PENDING_EMAIL_KEY } from './messages';

const VERIFY_CALLBACK = '/verify?next=%2Ffamily%2Fwelcome';

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');
    if (password !== String(form.get('confirm') ?? '')) return setError('The two passwords do not match.');
    setPending(true);
    setError(null);
    const result = await authClient.signUp.email({ email, password, name: '', callbackURL: VERIFY_CALLBACK });
    if (result.error) {
      setPending(false);
      return setError(authErrorMessage(result.error, 'We could not create the account. Try again.'));
    }
    sessionStorage.setItem(PENDING_EMAIL_KEY, email);
    router.push('/check-email');
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      <Field id="email" name="email" label="Email" type="email" autoComplete="email" required />
      <Field
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={PASSWORD_MAX_LENGTH}
        hint="At least 10 characters."
        required
      />
      <Field id="confirm" name="confirm" label="Confirm password" type="password" autoComplete="new-password" required />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="guardian" required className="mt-0.5 size-5 shrink-0 accent-primary" />
        <span>I am a parent or guardian aged 18 or over. Children practice in profiles inside this account and never get their own login.</span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
