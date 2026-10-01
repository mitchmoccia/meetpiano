import type { Page } from '@playwright/test';
import { attemptsFor, closeDatabase, progressFor } from './db';
import {
  addLearner,
  chooseLearner,
  createVerifiedParent,
  expect,
  finishMeetTheKeyboard,
  hubCard,
  learnerStorageKeys,
  PASSWORD,
  signIn,
  test
} from './support';

test.afterAll(closeDatabase);

function card(page: Page, heading: string) {
  return page.locator('section').filter({ has: page.getByRole('heading', { name: heading, exact: true }) });
}

test('a finished activity is stored for the chosen learner only and comes back in a fresh browser', async ({ page, browser }) => {
  const email = await createVerifiedParent(page, 'learners');
  const mia = await addLearner(page, 'Mia', 'Sun');
  await expect(page.getByText('Mia is ready to play.')).toBeVisible();
  const leo = await addLearner(page, 'Leo', 'Sky');

  await chooseLearner(page, 'Mia');
  const { envelope } = await finishMeetTheKeyboard(page);
  expect(envelope.entries.map((entry) => entry.childId)).toEqual(envelope.entries.map(() => mia));

  const [attempt, ...extra] = await attemptsFor(mia);
  expect(extra).toHaveLength(0);
  expect(attempt).toMatchObject({ lesson_id: 'L01', source: 'live', evidence_state: 'practiced', input_mode: 'touch' });
  expect(attempt?.completed_at).toBeInstanceOf(Date);
  expect(await progressFor(mia)).toEqual([
    { lesson_id: 'L01', evidence_state: 'practiced', attempt_count: 1, completed_attempt_count: 1, imported_attempt_count: 0 }
  ]);
  expect(await attemptsFor(leo)).toHaveLength(0);
  expect(await progressFor(leo)).toHaveLength(0);

  await page.goto('/family');
  await expect(page.getByRole('region', { name: 'Mia' })).toContainText('1 activity started · 1 finished');
  await expect(page.getByRole('region', { name: 'Leo' })).toContainText('No practice saved yet.');
  await expect(page.getByRole('button', { name: 'Start Meet the keyboard as Leo' })).toBeVisible();

  await page.goto(`/family/children/${mia}`);
  await expect(card(page, 'Recent activity')).toContainText('L01 · Meet the keyboard');
  await expect(card(page, 'Recent activity')).toContainText('Touch screen');
  await expect(card(page, 'Activities')).toContainText('1 started · 1 finished');
  await expect(card(page, 'Activities')).toContainText('1 try · 1 finished');
  await page.goto(`/family/children/${leo}`);
  await expect(card(page, 'Recent activity')).toContainText('No saved tries yet.');

  const fresh = await browser.newContext();
  const freshPage = await fresh.newPage();
  await signIn(freshPage, email, PASSWORD, '/play');
  await freshPage.waitForURL('**/play');
  expect(await learnerStorageKeys(freshPage)).toEqual([]);
  await chooseLearner(freshPage, 'Mia');
  await expect(hubCard(freshPage, 'L01').locator('.unit-state')).toHaveText('Practiced');
  await expect(hubCard(freshPage, 'L02').locator('.unit-state')).not.toHaveText('Locked');

  await chooseLearner(freshPage, 'Leo');
  await expect(hubCard(freshPage, 'L01').locator('.unit-state')).toHaveText('Not yet explored');
  await expect(hubCard(freshPage, 'L02').locator('.unit-state')).toHaveText('Locked');
  await fresh.close();
});

test('onboarding goes from sign-up to a first learner, a first activity, and saved progress on the dashboard', async ({ page }) => {
  await createVerifiedParent(page, 'onboarding');
  await expect(page.locator('[aria-current="step"]')).toContainText('Add a learner');
  await addLearner(page, 'Ava', 'Leaf');
  await expect(page.locator('[aria-current="step"]')).toContainText('Play a first activity');
  await page.getByRole('button', { name: 'Start Meet the keyboard as Ava' }).click();
  await page.waitForURL(/\/learn\/\?lesson=L01$/);
  await expect(page.locator('#learner-bar')).toContainText('Practicing as Ava');
  await finishMeetTheKeyboard(page);
  await page.locator('#learner-bar').getByRole('link', { name: 'Family' }).click();
  await page.waitForURL('**/family');
  await expect(page.getByRole('region', { name: 'Ava' })).toContainText('1 activity started · 1 finished');
});
