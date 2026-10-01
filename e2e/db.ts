import { execFileSync } from 'node:child_process';
import { config } from 'dotenv';
import { Pool, type QueryResultRow } from 'pg';

config({ path: '.env.local', quiet: true });

let ready: Promise<Pool> | null = null;

/** Checks run only against a database branch marked development, the same guard the operator scripts use. */
async function openPool(): Promise<Pool> {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error('Database checks need DATABASE_URL_UNPOOLED in .env.local.');
  const pool = new Pool({ connectionString: url, max: 2, connectionTimeoutMillis: 15_000 });
  const result = await pool.query<{ environment: string }>('select environment from database_environment where singleton');
  const marker = result.rows[0]?.environment ?? 'unmarked';
  if (marker !== 'development') {
    await pool.end();
    throw new Error(`End-to-end checks read only the development branch. This database is marked "${marker}".`);
  }
  return pool;
}

/** Read-only queries for asserting what the app stored. Tests change data only through the app and the operator CLI. */
export async function rows<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<T[]> {
  ready ??= openPool();
  const result = await (await ready).query<T>(text, values);
  return result.rows;
}

export async function closeDatabase(): Promise<void> {
  const pool = ready;
  ready = null;
  if (pool) await (await pool).end();
}

export type AttemptRow = {
  client_attempt_id: string;
  child_id: string;
  lesson_id: string;
  source: string;
  revision: number;
  evidence_state: string | null;
  input_mode: string;
  completed_at: Date | null;
};

export function attemptsFor(childId: string): Promise<AttemptRow[]> {
  return rows<AttemptRow>(
    `select client_attempt_id, child_id, lesson_id, source, revision, evidence_state, input_mode, completed_at
       from lesson_attempt where child_id = $1 order by started_at`,
    [childId]
  );
}

export function attemptById(clientAttemptId: string): Promise<AttemptRow[]> {
  return rows<AttemptRow>(
    `select client_attempt_id, child_id, lesson_id, source, revision, evidence_state, input_mode, completed_at
       from lesson_attempt where client_attempt_id = $1`,
    [clientAttemptId]
  );
}

export type ProgressRow = {
  lesson_id: string;
  evidence_state: string | null;
  attempt_count: number;
  completed_attempt_count: number;
  imported_attempt_count: number;
};

export function progressFor(childId: string): Promise<ProgressRow[]> {
  return rows<ProgressRow>(
    `select lesson_id, evidence_state, attempt_count, completed_attempt_count, imported_attempt_count
       from lesson_progress where child_id = $1 order by lesson_id`,
    [childId]
  );
}

export async function syncEventReasons(userId: string): Promise<string[]> {
  const events = await rows<{ reason: string }>('select reason from progress_sync_event where user_id = $1 order by created_at', [userId]);
  return events.map((event) => event.reason);
}

/** The controlled admin bootstrap: the operator CLI, never a sign-up path. */
export function grantAdmin(email: string): string {
  return execFileSync(
    'pnpm',
    ['--silent', 'admin:grant', `--email=${email}`, '--expect-environment=development', '--note=end-to-end admin check'],
    { encoding: 'utf8', stdio: 'pipe' }
  );
}
