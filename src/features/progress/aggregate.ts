import 'server-only';
import { sql } from 'drizzle-orm';
import type { Transaction } from '@/db/client';

const EVIDENCE_RANK_SQL = sql.raw(
  `case evidence_state when 'explored' then 1 when 'practiced' then 2 when 'independent' then 3 when 'retained' then 4 else 0 end`
);

/**
 * Rebuilds one lesson_progress row from all of its attempts inside the caller's transaction, so the aggregate always
 * matches the attempts it summarizes. The explored and practiced times keep the earliest value ever observed.
 */
export async function recomputeLessonProgress(tx: Transaction, childId: string, lessonId: string): Promise<void> {
  await tx.execute(sql`
    insert into lesson_progress as lp (
      child_id, lesson_id, evidence_state, attempt_count, completed_attempt_count, imported_attempt_count,
      first_started_at, last_activity_at, first_completed_at, explored_at, practiced_at, independent_at, retained_at,
      last_input_mode
    )
    select
      ${childId}::uuid,
      ${lessonId}::text,
      (array['explored', 'practiced', 'independent', 'retained'])[nullif(max(r.rank), 0)],
      count(*),
      count(r.completed_at),
      count(*) filter (where r.source = 'import'),
      min(r.started_at),
      max(r.last_activity_at),
      min(r.first_completed_at),
      min(coalesce(r.first_completed_at, r.last_activity_at)) filter (where r.rank >= 1),
      min(coalesce(r.first_completed_at, r.last_activity_at)) filter (where r.rank >= 2),
      min(r.first_completed_at) filter (where r.rank >= 3),
      min(r.first_completed_at) filter (where r.rank >= 4),
      (array_agg(r.input_mode order by r.last_activity_at desc))[1]
    from (
      select *, ${EVIDENCE_RANK_SQL} as rank
      from lesson_attempt
      where child_id = ${childId}::uuid and lesson_id = ${lessonId}
    ) r
    on conflict (child_id, lesson_id) do update set
      evidence_state = excluded.evidence_state,
      attempt_count = excluded.attempt_count,
      completed_attempt_count = excluded.completed_attempt_count,
      imported_attempt_count = excluded.imported_attempt_count,
      first_started_at = excluded.first_started_at,
      last_activity_at = excluded.last_activity_at,
      first_completed_at = excluded.first_completed_at,
      explored_at = least(lp.explored_at, excluded.explored_at),
      practiced_at = least(lp.practiced_at, excluded.practiced_at),
      independent_at = excluded.independent_at,
      retained_at = excluded.retained_at,
      last_input_mode = excluded.last_input_mode,
      updated_at = now()
  `);
}
