import { sql } from 'drizzle-orm';
import { getDb } from '@/db/client';

export type RateRule = { windowSeconds: number; max: number };

export const RATE_RULES = {
  attemptSave: { windowSeconds: 60, max: 120 },
  legacyImport: { windowSeconds: 600, max: 10 },
  passwordCheck: { windowSeconds: 600, max: 8 },
  childWrite: { windowSeconds: 600, max: 40 },
  adminWrite: { windowSeconds: 60, max: 60 }
} satisfies Record<string, RateRule>;

/** Fixed-window counter stored in Postgres so limits hold across serverless instances. */
export async function consumeRateLimit(key: string, rule: RateRule): Promise<boolean> {
  const window = `${rule.windowSeconds} seconds`;
  const result = await getDb().execute<{ count: number }>(sql`
    insert into app_rate_limit (key, window_start, count) values (${key}, now(), 1)
    on conflict (key) do update set
      count = case when app_rate_limit.window_start < now() - ${window}::interval then 1 else app_rate_limit.count + 1 end,
      window_start = case when app_rate_limit.window_start < now() - ${window}::interval then now() else app_rate_limit.window_start end
    returning count
  `);
  const count = Number(result.rows[0]?.count ?? Number.POSITIVE_INFINITY);
  return count <= rule.max;
}

export class RateLimitedError extends Error {
  constructor() {
    super('Too many attempts. Wait a few minutes and try again.');
    this.name = 'RateLimitedError';
  }
}

export async function enforceRateLimit(key: string, rule: RateRule): Promise<void> {
  if (!(await consumeRateLimit(key, rule))) throw new RateLimitedError();
}
