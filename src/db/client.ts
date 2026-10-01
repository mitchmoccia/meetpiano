import { attachDatabasePool } from '@vercel/functions';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { appEnv, serverEnv } from '@/lib/env';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

type DbGlobals = { meetpianoPool?: Pool; meetpianoDb?: Database; meetpianoDbCheck?: Promise<void> };
const globals = globalThis as unknown as DbGlobals;

function createPool(): Pool {
  const pool = new Pool({
    connectionString: serverEnv().DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000
  });
  attachDatabasePool(pool);
  return pool;
}

export function getPool(): Pool {
  globals.meetpianoPool ??= createPool();
  return globals.meetpianoPool;
}

export function getDb(): Database {
  globals.meetpianoDb ??= drizzle(getPool(), { schema });
  return globals.meetpianoDb;
}

export async function databaseEnvironmentMarker(pool: Pool = getPool()): Promise<string | null> {
  try {
    const result = await pool.query<{ environment: string }>('select environment from database_environment where singleton');
    return result.rows[0]?.environment ?? null;
  } catch (error) {
    throw new Error('Database environment marker is unreadable. Apply migrations and mark the branch first.', { cause: error });
  }
}

async function checkDatabaseEnvironment(): Promise<void> {
  const marker = await databaseEnvironmentMarker();
  const app = appEnv();
  if (app === 'production' && marker !== 'production') {
    throw new Error('Production must use the production database branch.');
  }
  if (app !== 'production' && marker !== 'development') {
    throw new Error('Non-production code may only use the development database branch.');
  }
}

/** Refuses to run against a database whose environment marker does not match this deployment. */
export function assertDatabaseEnvironment(): Promise<void> {
  globals.meetpianoDbCheck ??= checkDatabaseEnvironment().catch((error: unknown) => {
    globals.meetpianoDbCheck = undefined;
    throw error;
  });
  return globals.meetpianoDbCheck;
}
