import type { Page } from '@playwright/test';
import { attemptById, attemptsFor, closeDatabase, progressFor, syncEventReasons } from './db';
import {
  addLearner,
  chooseLearner,
  createVerifiedParent,
  expect,
  finishMeetTheKeyboard,
  type Envelope,
  type SaveResult,
  type SentAttempt,
  test
} from './support';

test.afterAll(closeDatabase);

type Posted = { status: number; body: { results?: SaveResult[]; error?: string } | null };

/** Sends a body to the attempts endpoint from inside the signed-in page, as the page's own outbox would. */
function postAttempts(page: Page, body: unknown): Promise<Posted> {
  return page.evaluate(async (payload) => {
    const response = await fetch('/api/learner/attempts', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  }, body);
}

function finishedEntry(envelope: Envelope): { childId: string; attempt: SentAttempt } {
  const entry = envelope.entries.find((item) => item.attempt.completedAt);
  if (!entry) throw new Error('The finished save had no completed attempt.');
  return entry;
}

async function learnerUserId(page: Page): Promise<string> {
  const context = await page.evaluate(() => fetch('/api/learner/context').then((response) => response.json()));
  return (context as { userId: string }).userId;
}

test('replayed, concurrent, and stale saves keep one attempt and never lower progress', async ({ page }) => {
  await createVerifiedParent(page, 'saves');
  const mia = await addLearner(page, 'Mia');
  await chooseLearner(page, 'Mia');
  const { envelope } = await finishMeetTheKeyboard(page);
  const entry = finishedEntry(envelope);
  const id = entry.attempt.clientAttemptId;
  const [stored] = await attemptById(id);
  const single = { userId: envelope.userId, entries: [entry] };

  const replays = await Promise.all([postAttempts(page, single), postAttempts(page, single), postAttempts(page, envelope)]);
  for (const replay of replays) {
    expect(replay.status).toBe(200);
    expect(replay.body?.results?.map((result) => result.status)).toEqual(replay.body?.results?.map(() => 'unchanged'));
  }

  const stale = { ...entry.attempt, revision: 1, phase: 'guided', evidenceState: 'explored', completedAt: null };
  const staleSave = await postAttempts(page, { userId: envelope.userId, entries: [{ childId: mia, attempt: stale }] });
  expect(staleSave.body?.results?.[0]?.status).toBe('unchanged');

  const later = { ...stale, revision: entry.attempt.revision + 1, lastActivityAt: new Date().toISOString() };
  const laterSave = await postAttempts(page, { userId: envelope.userId, entries: [{ childId: mia, attempt: later }] });
  expect(laterSave.body?.results?.[0]).toMatchObject({ status: 'saved', revision: entry.attempt.revision + 1 });

  const rows = await attemptsFor(mia);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ client_attempt_id: id, evidence_state: 'practiced', revision: entry.attempt.revision + 1 });
  expect(rows[0]?.completed_at?.getTime()).toBe(stored?.completed_at?.getTime());
  expect(await progressFor(mia)).toEqual([
    { lesson_id: 'L01', evidence_state: 'practiced', attempt_count: 1, completed_attempt_count: 1, imported_attempt_count: 0 }
  ]);
});

test('the save endpoint ignores learners, accounts, and attempts that are not the caller’s', async ({ page, browser }) => {
  await createVerifiedParent(page, 'owner');
  const mia = await addLearner(page, 'Mia');
  await chooseLearner(page, 'Mia');
  const { envelope } = await finishMeetTheKeyboard(page);
  const mine = finishedEntry(envelope);

  const intruderContext = await browser.newContext();
  const intruder = await intruderContext.newPage();
  await createVerifiedParent(intruder, 'intruder');
  const zed = await addLearner(intruder, 'Zed');
  await chooseLearner(intruder, 'Zed');
  const intruderId = await learnerUserId(intruder);

  const forged = { ...mine.attempt, clientAttemptId: `forged-${Date.now()}`, revision: 1 };
  const intoMia = await postAttempts(intruder, { userId: intruderId, entries: [{ childId: mia, attempt: forged }] });
  expect(intoMia.body?.results?.[0]).toMatchObject({ status: 'rejected', reason: 'unknown-learner' });
  expect(await attemptById(forged.clientAttemptId)).toHaveLength(0);

  const takeOver = await postAttempts(intruder, { userId: intruderId, entries: [{ childId: zed, attempt: mine.attempt }] });
  expect(takeOver.body?.results?.[0]).toMatchObject({ status: 'conflict', reason: 'other-learner' });
  expect((await attemptById(mine.attempt.clientAttemptId))[0]?.child_id).toBe(mia);
  expect(await attemptsFor(zed)).toHaveLength(0);

  const asOwner = await postAttempts(intruder, envelope);
  expect(asOwner).toMatchObject({ status: 409, body: { error: 'account-mismatch' } });

  const crossSite = await intruder.request.post('/api/learner/attempts', {
    headers: { origin: 'https://evil.example' },
    data: { userId: intruderId, entries: [{ childId: zed, attempt: forged }] }
  });
  expect(crossSite.status()).toBe(403);
  await intruderContext.close();

  const anonymousContext = await browser.newContext();
  const anonymous = await anonymousContext.newPage();
  await anonymous.goto('/learn/');
  expect((await postAttempts(anonymous, envelope)).status).toBe(401);
  await anonymousContext.close();

  expect(await attemptsFor(mia)).toHaveLength(1);
});

test('summaries outside the allowed bounds are rejected and recorded for diagnosis', async ({ page }) => {
  await createVerifiedParent(page, 'bounds');
  const mia = await addLearner(page, 'Mia');
  await chooseLearner(page, 'Mia');
  const { envelope } = await finishMeetTheKeyboard(page);
  const entry = finishedEntry(envelope);
  const userId = envelope.userId;
  const base = { ...entry.attempt, clientAttemptId: `bounds-${Date.now()}`, revision: 1 };
  const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const cases: Array<[string, unknown, string]> = [
    ['future start', { ...base, startedAt: future, lastActivityAt: future }, 'clock-ahead'],
    ['unknown lesson', { ...base, clientAttemptId: `${base.clientAttemptId}-l`, lessonId: 'L99' }, 'unknown-lesson-version'],
    ['extra field', { ...base, clientAttemptId: `${base.clientAttemptId}-x`, rawMidi: [144, 60, 100] }, 'invalid-summary'],
    [
      'unfinished mastery',
      { ...base, clientAttemptId: `${base.clientAttemptId}-m`, evidenceState: 'independent', completedAt: null },
      'mastery-needs-completion'
    ]
  ];
  for (const [label, attempt, reason] of cases) {
    const result = await postAttempts(page, { userId, entries: [{ childId: mia, attempt }] });
    expect(result.body?.results?.[0], label).toMatchObject({ status: 'rejected', reason });
  }
  expect(await attemptsFor(mia)).toHaveLength(1);
  expect(await syncEventReasons(userId)).toEqual([
    'clock-ahead',
    'unknown-lesson-version',
    expect.stringMatching(/^invalid-summary/),
    'mastery-needs-completion'
  ]);
});
