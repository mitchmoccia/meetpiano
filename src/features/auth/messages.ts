export type AuthClientError = { status?: number; code?: string; message?: string } | null | undefined;

const CODE_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'That email and password do not match an account.',
  EMAIL_NOT_VERIFIED: 'Confirm your email first. We just sent a fresh confirmation link.',
  PASSWORD_TOO_SHORT: 'Use at least 10 characters.',
  PASSWORD_TOO_LONG: 'Use 128 characters or fewer.',
  INVALID_TOKEN: 'This link has expired or was already used. Ask for a new one.',
  TOKEN_EXPIRED: 'This link has expired. Ask for a new one.',
  INVALID_EMAIL: 'Enter a valid email address.'
};

export function authErrorMessage(error: AuthClientError, fallback: string): string {
  if (!error) return fallback;
  if (error.status === 429) return 'Too many attempts. Wait a few minutes and try again.';
  return (error.code && CODE_MESSAGES[error.code]) || fallback;
}

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
export const PENDING_EMAIL_KEY = 'meetpiano:pending-email';
