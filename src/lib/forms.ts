export type FormState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; message?: string; userId?: string };

export const IDLE: FormState = { status: 'idle' };

export const TOO_MANY_ATTEMPTS = 'Too many attempts. Wait a few minutes and try again.';

export function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}
