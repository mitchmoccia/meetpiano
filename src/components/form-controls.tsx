'use client';

import type { ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert, Button } from '@/components/ui';
import type { FormState } from '@/lib/forms';

type SubmitButtonProps = ComponentProps<typeof Button> & { pendingLabel: string };

export function SubmitButton({ children, pendingLabel, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.status === 'error') return <Alert variant="destructive">{state.message}</Alert>;
  if (state.status === 'ok' && state.message) return <Alert variant="success">{state.message}</Alert>;
  return null;
}
