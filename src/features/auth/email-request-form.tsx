'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Field } from '@/components/field';
import { Alert, Button } from '@/components/ui';
import { authClient } from '@/lib/auth/client';
import { authErrorMessage, PENDING_EMAIL_KEY } from './messages';

type EmailRequestFormProps = { kind: 'verification' | 'reset'; submitLabel: string };

const NEUTRAL: Record<EmailRequestFormProps['kind'], string> = {
  verification: 'If that address has an account waiting for confirmation, a new link is on its way.',
  reset: 'If that address has a MeetPiano account, a reset link is on its way. It expires in 30 minutes.'
};

/** Both requests answer the same way whether or not the address has an account, so the form cannot reveal who signed up. */
export function EmailRequestForm({ kind, submitLabel }: EmailRequestFormProps) {
  const emailRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'destructive'; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(PENDING_EMAIL_KEY);
    if (saved && emailRef.current && !emailRef.current.value) emailRef.current.value = saved;
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim().toLowerCase();
    setPending(true);
    const result =
      kind === 'verification'
        ? await authClient.sendVerificationEmail({ email, callbackURL: '/verify?next=%2Ffamily%2Fwelcome' })
        : await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' });
    setPending(false);
    const failed = result.error && (result.error.status === 429 || result.error.code === 'INVALID_EMAIL');
    setMessage(failed ? { tone: 'destructive', text: authErrorMessage(result.error, NEUTRAL[kind]) } : { tone: 'success', text: NEUTRAL[kind] });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {message ? <Alert variant={message.tone}>{message.text}</Alert> : null}
      <Field ref={emailRef} id="email" name="email" label="Email" type="email" autoComplete="email" required />
      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : submitLabel}
      </Button>
    </form>
  );
}
