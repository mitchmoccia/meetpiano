import type { Page, Response } from '@playwright/test';
import { attemptById, attemptsFor, closeDatabase } from './db';
import {
  addLearner,
  chooseLearner,
  createVerifiedParent,
  type Envelope,
  expect,
  finishMeetTheKeyboard,
  hubCard,
  isAttemptsPost,
  learnerStorageKeys,
  PASSWORD,
  playMeetTheKeyboard,
  signIn,
  signOut,
  test
} from './support';

test.afterAll(closeDatabase);

const RETRYING = "Can't reach MeetPiano · trying again";

async function blockSaves(page: Page): Promise<void> {
  await page.route('**/api/learner/attempts', (route) => route.abort('internetdisconnected'));
}

/** Plays L01 while saves cannot reach the server and returns the id of the try left waiting in the outbox. */
async function playWithoutSaving(page: Page, childId: string): Promise<string> {
  await blockSaves(page);
  await playMeetTheKeyboard(page);
  await expect(page.locator('.learner-status')).toHaveText(RETRYING);
  const id = await page.evaluate((child) => {
    const record = JSON.parse(window.localStorage.getItem(`meetpiano:learner:v1:${child}:sync`) ?? '{}');
    return record.queue?.[0]?.clientAttemptId ?? '';
  }, childId);
  expect(id).not.toBe('');
  return id;
}

function sentEnvelopes(page: Page): Envelope[] {
  const sent: Envelope[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/learner/attempts') sent.push(request.postDataJSON());
  });
  return sent;
}

function carries(response: Response, clientAttemptId: string): boolean {
  if (!isAttemptsPost(response) || !response.ok()) return false;
  return (response.request().postDataJSON() as Envelope).entries.some((entry) => entry.attempt.clientAttemptId === clientAttemptId);
}

test('a try waiting to save during a learner switch is saved to the learner who played it', async ({ page }) => {
  await createVerifiedParent(page, 'switch');
  const mia = await addLearner(page, 'Mia');
  const leo = await addLearner(page, 'Leo', 'Sky');
  await chooseLearner(page, 'Mia');
  const waiting = await playWithoutSaving(page, mia);

  await page.locator('#learner-bar').getByRole('link', { name: 'Switch learner' }).click();
  await page.waitForURL('**/play');
  await page.unrouteAll();
  const delivered = page.waitForResponse((response) => carries(response, waiting));
  await page.getByRole('button', { name: 'Leo', exact: true }).click();
  const envelope = (await delivered).request().postDataJSON() as Envelope;
  expect(envelope.entries.find((entry) => entry.attempt.clientAttemptId === waiting)?.childId).toBe(mia);

  await expect(page.locator('#learner-bar')).toContainText('Practicing as Leo');
  await expect(hubCard(page, 'L01').locator('.unit-state')).toHaveText('Not yet explored');
  expect((await attemptById(waiting))[0]?.child_id).toBe(mia);
  expect(await attemptsFor(leo)).toHaveLength(0);
});

test('signing out with an unsent try asks first, and signing out anyway removes it from the browser', async ({ page, context }) => {
  await createVerifiedParent(page, 'signout');
  const mia = await addLearner(page, 'Mia');
  await chooseLearner(page, 'Mia');
  await context.route('**/api/learner/attempts', (route) => route.abort('internetdisconnected'));
  const waiting = await playWithoutSaving(page, mia);

  // The lesson tab stays open: leaving it would send the try with a keepalive request that routing cannot hold back.
  const grownUp = await context.newPage();
  await grownUp.goto('/family');
  await grownUp.getByRole('button', { name: 'Sign out' }).click();
  await expect(grownUp.getByText('1 practice try has not reached MeetPiano yet.', { exact: false })).toBeVisible();
  await grownUp.getByRole('button', { name: 'Stay signed in' }).click();
  await expect(grownUp.getByRole('heading', { name: 'Your family' })).toBeVisible();
  expect(await learnerStorageKeys(grownUp)).toContain(`meetpiano:learner:v1:${mia}:sync`);

  await grownUp.getByRole('button', { name: 'Sign out' }).click();
  await grownUp.getByRole('button', { name: 'Sign out anyway' }).click();
  await grownUp.waitForURL('**/signin?signedOut=1');
  expect(await learnerStorageKeys(grownUp)).toEqual([]);
  expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain('mp_learner');
  expect(await attemptById(waiting)).toHaveLength(0);

  await expect(page).toHaveURL(/\/learn\/$/);
  await expect(page.locator('#unit-hub')).toBeVisible();
  await expect(page.locator('#learner-bar')).toHaveCount(0);
  expect(await learnerStorageKeys(page)).toEqual([]);
  expect(await attemptById(waiting)).toHaveLength(0);
});

test('when another parent signs in on the same browser, the first family’s waiting try is neither shown nor sent', async ({ page, context }) => {
  const firstParent = await createVerifiedParent(page, 'shared-first');
  const mia = await addLearner(page, 'Mia');
  await chooseLearner(page, 'Mia');
  const waiting = await playWithoutSaving(page, mia);

  await context.clearCookies({ name: /^better-auth\./ });
  const second = await context.newPage();
  const secondSent = sentEnvelopes(second);
  await createVerifiedParent(second, 'shared-second');

  await page.unrouteAll();
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('.learner-status')).toHaveText('Another grown-up signed in · not saving');
  expect(await attemptById(waiting)).toHaveLength(0);
  await page.close();

  const zed = await addLearner(second, 'Zed');
  await chooseLearner(second, 'Zed');
  await expect(hubCard(second, 'L01').locator('.unit-state')).toHaveText('Not yet explored');
  const { envelope } = await finishMeetTheKeyboard(second);
  for (const sent of secondSent) {
    expect(sent.userId).toBe(envelope.userId);
    expect(sent.entries.map((entry) => entry.childId)).toEqual(sent.entries.map(() => zed));
  }
  expect(await attemptById(waiting)).toHaveLength(0);
  expect(await attemptsFor(zed)).toHaveLength(1);

  await second.goto('/family');
  await signOut(second);
  const remaining = await learnerStorageKeys(second);
  expect(remaining).toContain(`meetpiano:learner:v1:${mia}:sync`);
  expect(remaining.some((key) => key.includes(zed))).toBe(false);

  const delivered = second.waitForResponse((response) => carries(response, waiting));
  await signIn(second, firstParent, PASSWORD, '/play');
  await second.waitForURL('**/play');
  await second.getByRole('button', { name: 'Mia', exact: true }).click();
  await delivered;
  expect((await attemptById(waiting))[0]?.child_id).toBe(mia);
});
