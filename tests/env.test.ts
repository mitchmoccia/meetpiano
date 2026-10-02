import { afterEach, describe, expect, it, vi } from 'vitest';

const CLEAR = ['VERCEL_ENV', 'EMAIL_TRANSPORT', 'SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL', 'BETTER_AUTH_URL', 'VERCEL_URL', 'VERCEL_BRANCH_URL'];
const SENDGRID = { EMAIL_TRANSPORT: 'sendgrid', SENDGRID_API_KEY: 'SG.test-key', SENDGRID_FROM_EMAIL: 'hello@meetpiano.app' };

/** A fresh copy of the env module, because serverEnv() caches the first configuration it validates. */
async function envModule(vars: Record<string, string>) {
  vi.resetModules();
  for (const key of CLEAR) vi.stubEnv(key, undefined);
  vi.stubEnv('DATABASE_URL', 'postgresql://user:password@localhost:5432/meetpiano');
  vi.stubEnv('BETTER_AUTH_SECRET', 'a'.repeat(32));
  for (const [key, value] of Object.entries(vars)) vi.stubEnv(key, value);
  return import('@/lib/env');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('server environment', () => {
  it('refuses captured email in production', async () => {
    const env = await envModule({ VERCEL_ENV: 'production', EMAIL_TRANSPORT: 'capture', BETTER_AUTH_URL: 'https://meetpiano.app' });
    expect(() => env.serverEnv()).toThrow('Production must send real email');
  });

  it('refuses SendGrid without an API key and sender', async () => {
    const env = await envModule({ VERCEL_ENV: 'production', EMAIL_TRANSPORT: 'sendgrid', BETTER_AUTH_URL: 'https://meetpiano.app' });
    expect(() => env.serverEnv()).toThrow('SendGrid needs SENDGRID_API_KEY and SENDGRID_FROM_EMAIL');
  });

  it('refuses a production auth URL without https', async () => {
    const env = await envModule({ VERCEL_ENV: 'production', ...SENDGRID, BETTER_AUTH_URL: 'http://meetpiano.app' });
    expect(() => env.serverEnv()).toThrow('Production needs an https BETTER_AUTH_URL');
  });

  it('trusts only its own origin in production', async () => {
    const env = await envModule({ VERCEL_ENV: 'production', ...SENDGRID, BETTER_AUTH_URL: 'https://meetpiano.app' });
    expect(env.trustedOrigins()).toEqual(['https://meetpiano.app']);
    expect(env.isSecureContext()).toBe(true);
  });

  it('serves a preview from its branch URL and trusts both deployment URLs', async () => {
    const env = await envModule({
      VERCEL_ENV: 'preview',
      EMAIL_TRANSPORT: 'capture',
      VERCEL_URL: 'meetpiano-abc123.vercel.app',
      VERCEL_BRANCH_URL: 'meetpiano-git-feature.vercel.app'
    });
    expect(env.appBaseUrl()).toBe('https://meetpiano-git-feature.vercel.app');
    expect(env.trustedOrigins().sort()).toEqual(['https://meetpiano-abc123.vercel.app', 'https://meetpiano-git-feature.vercel.app']);
  });
});
