import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { Database } from '@/db/client';
import * as schema from '@/db/schema';

config({ path: '.env.local', quiet: true });

export type BranchEnvironment = 'production' | 'development';

export function argValue(name: string, argv = process.argv): string | undefined {
  const prefix = `--${name}=`;
  return argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

/** Operator scripts must name the branch they expect, and stop if the database marker says otherwise. */
export function expectedEnvironment(): BranchEnvironment {
  const value = argValue('expect-environment');
  if (value !== 'production' && value !== 'development') {
    throw new Error('Pass --expect-environment=development or --expect-environment=production.');
  }
  return value;
}

export async function openDatabase(expected: BranchEnvironment): Promise<{ db: Database; close: () => Promise<void> }> {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL_UNPOOLED (or DATABASE_URL) is required.');
  const pool = new Pool({ connectionString: url, max: 2, connectionTimeoutMillis: 15_000 });
  const close = () => pool.end();
  try {
    const result = await pool.query<{ environment: string }>('select environment from database_environment where singleton');
    const marker = result.rows[0]?.environment ?? 'unmarked';
    if (marker !== expected) throw new Error(`This database is marked "${marker}", not "${expected}". Nothing was changed.`);
  } catch (error) {
    await close();
    throw error;
  }
  return { db: drizzle(pool, { schema }), close };
}

export async function runScript(main: () => Promise<void>): Promise<void> {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
