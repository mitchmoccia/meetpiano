import { z } from 'zod';

export type AppEnv = 'production' | 'preview' | 'development' | 'test';

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const serverEnvSchema = z
  .object({
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must be a postgres connection string'),
    BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
    BETTER_AUTH_URL: optionalText.pipe(z.url().optional()),
    EMAIL_TRANSPORT: z.enum(['sendgrid', 'capture']),
    SENDGRID_API_KEY: optionalText,
    SENDGRID_FROM_EMAIL: optionalText.pipe(z.email().optional()),
    SENDGRID_FROM_NAME: optionalText,
    VERCEL_URL: optionalText,
    VERCEL_BRANCH_URL: optionalText
  })
  .superRefine((env, ctx) => {
    const app = appEnv();
    if (app === 'production' && env.EMAIL_TRANSPORT !== 'sendgrid') {
      ctx.addIssue({ code: 'custom', path: ['EMAIL_TRANSPORT'], message: 'Production must send real email (sendgrid).' });
    }
    if (env.EMAIL_TRANSPORT === 'sendgrid' && (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL)) {
      ctx.addIssue({ code: 'custom', path: ['SENDGRID_API_KEY'], message: 'SendGrid needs SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.' });
    }
    if (app === 'production' && !env.BETTER_AUTH_URL?.startsWith('https://')) {
      ctx.addIssue({ code: 'custom', path: ['BETTER_AUTH_URL'], message: 'Production needs an https BETTER_AUTH_URL.' });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function appEnv(): AppEnv {
  const vercel = process.env.VERCEL_ENV;
  if (vercel === 'production' || vercel === 'preview' || vercel === 'development') return vercel;
  return process.env.NODE_ENV === 'test' ? 'test' : 'development';
}

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid server environment. ${fields}`);
  }
  cached = parsed.data;
  return cached;
}

function httpsUrl(host: string | undefined): string | undefined {
  return host ? `https://${host}` : undefined;
}

export function appBaseUrl(): string {
  const env = serverEnv();
  const app = appEnv();
  if (app === 'preview') {
    const previewUrl = httpsUrl(env.VERCEL_BRANCH_URL) ?? httpsUrl(env.VERCEL_URL);
    if (previewUrl) return previewUrl;
  }
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL.replace(/\/$/, '');
  if (app === 'production') throw new Error('BETTER_AUTH_URL is required in production.');
  return 'http://localhost:3000';
}

export function trustedOrigins(): string[] {
  const env = serverEnv();
  const origins = new Set<string>([new URL(appBaseUrl()).origin]);
  if (env.BETTER_AUTH_URL) origins.add(new URL(env.BETTER_AUTH_URL).origin);
  if (appEnv() === 'preview') {
    const urls = [httpsUrl(env.VERCEL_URL), httpsUrl(env.VERCEL_BRANCH_URL)];
    for (const url of urls) if (url) origins.add(url);
  }
  return [...origins];
}

export function isSecureContext(): boolean {
  return appBaseUrl().startsWith('https://');
}
