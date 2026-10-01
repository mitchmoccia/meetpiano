import { waitUntil } from '@vercel/functions';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { getDb } from '@/db/client';
import { authAccount, authRateLimit, authSession, authUser, authVerification } from '@/db/schema';
import { LEARNER_COOKIE } from '@/features/learner/cookie';
import { existingAccountMessage, resetPasswordMessage, sendEmail, verifyEmailMessage } from '@/lib/email';
import { appBaseUrl, isSecureContext, serverEnv, trustedOrigins } from '@/lib/env';

const MINUTE = 60;
const DAY = 24 * 60 * MINUTE;

function rateRules() {
  return {
    '/sign-in/email': { window: 5 * MINUTE, max: 10 },
    '/sign-up/email': { window: 10 * MINUTE, max: 5 },
    '/request-password-reset': { window: 10 * MINUTE, max: 3 },
    '/reset-password': { window: 10 * MINUTE, max: 5 },
    '/send-verification-email': { window: 10 * MINUTE, max: 3 },
    '/change-password': { window: 10 * MINUTE, max: 5 },
    '/delete-user': { window: 10 * MINUTE, max: 5 }
  };
}

function createAuth() {
  const env = serverEnv();
  const baseUrl = appBaseUrl();
  return betterAuth({
    appName: 'MeetPiano',
    baseURL: baseUrl,
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: trustedOrigins(),
    telemetry: { enabled: false },
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
      schema: { user: authUser, session: authSession, account: authAccount, verification: authVerification, rateLimit: authRateLimit }
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 30 * MINUTE,
      sendResetPassword: ({ user, url }) => sendEmail(resetPasswordMessage(user.email, url)),
      onExistingUserSignUp: ({ user }) =>
        sendEmail(existingAccountMessage(user.email, `${baseUrl}/signin`, `${baseUrl}/forgot-password`))
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: DAY,
      sendVerificationEmail: ({ user, url }) => sendEmail(verifyEmailMessage(user.email, url))
    },
    session: { expiresIn: 14 * DAY, updateAge: DAY, freshAge: 15 * MINUTE },
    user: { deleteUser: { enabled: true } },
    rateLimit: { enabled: true, storage: 'database', window: MINUTE, max: 100, customRules: rateRules() },
    advanced: {
      useSecureCookies: isSecureContext(),
      ipAddress: { ipAddressHeaders: ['x-vercel-forwarded-for', 'x-forwarded-for'] },
      backgroundTasks: { handler: waitUntil }
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/sign-out' || ctx.path === '/delete-user') {
          ctx.setCookie(LEARNER_COOKIE, '', { path: '/', maxAge: 0, sameSite: 'lax' });
        }
      })
    },
    plugins: [nextCookies()]
  });
}

export type Auth = ReturnType<typeof createAuth>;

const globals = globalThis as unknown as { meetpianoAuth?: Auth };

/** Built on first use so builds and static pages never need runtime secrets. */
export function getAuth(): Auth {
  globals.meetpianoAuth ??= createAuth();
  return globals.meetpianoAuth;
}
