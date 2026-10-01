import type { Page } from '@playwright/test';
import { attemptsFor, closeDatabase, progressFor } from './db';
import { addLearner, chooseLearner, createVerifiedParent, expect, playMeetTheKeyboard, test } from './support';

test.afterAll(closeDatabase);

const GUEST_KEY = 'meetpiano:beginner-v1';

function guestRecords(page: Page): Promise<string | null> {
  return page.evaluate((key) => window.localStorage.getItem(key), GUEST_KEY);
}

/** Older builds also kept lesson-level flags; an import must never turn those into attempts or stronger results. */
async function addLegacyFlags(page: Page): Promise<string> {
  return page.evaluate((key) => {
    const store = JSON.parse(window.localStorage.getItem(key) ?? '{}');
    store.lessons.L01.evidenceState = 'retained';
    store.lessons.L02 = { lessonId: 'L02', evidenceState: 'independent', firstCompletionRewarded: true, firstCompletedAt: '2025-06-01T10:00:00.000Z', attempts: [] };
    window.localStorage.setItem(key, JSON.stringify(store));
    return window.localStorage.getItem(key) ?? '';
  }, GUEST_KEY);
}

async function importGuestPractice(page: Page, childId: string, nickname: string): Promise<void> {
  await page.goto(`/family/children/${childId}`);
  await page.getByRole('button', { name: 'Check this browser for guest practice' }).click();
  await expect(page.getByText('Found 1 guest try across 1 activity.')).toBeVisible();
  const importButton = page.getByRole('button', { name: `Import to ${nickname}` });
  await expect(importButton).toBeDisabled();
  await page.getByLabel(`These guest tries on this browser were done by ${nickname}.`).check();
  await importButton.click();
}

test('guest practice is imported only into the learner the parent confirms, once, and stays on the browser', async ({ page }) => {
  await playMeetTheKeyboard(page);
  const guest = await addLegacyFlags(page);

  await createVerifiedParent(page, 'import');
  const mia = await addLearner(page, 'Mia');
  const leo = await addLearner(page, 'Leo', 'Sky');
  await chooseLearner(page, 'Mia');
  await page.waitForLoadState('networkidle');
  expect(await attemptsFor(mia)).toHaveLength(0);

  await importGuestPractice(page, mia, 'Mia');
  await expect(page.getByText('Saved 1 try. Guest records stay on this browser.')).toBeVisible();
  const [imported, ...extra] = await attemptsFor(mia);
  expect(extra).toHaveLength(0);
  expect(imported).toMatchObject({ lesson_id: 'L01', source: 'import', evidence_state: 'practiced', revision: 1 });
  expect(await progressFor(mia)).toEqual([
    { lesson_id: 'L01', evidence_state: 'practiced', attempt_count: 1, completed_attempt_count: 1, imported_attempt_count: 1 }
  ]);
  expect(await guestRecords(page)).toBe(guest);

  await importGuestPractice(page, mia, 'Mia');
  await expect(page.getByText('Saved 0 tries. 1 were already saved. Guest records stay on this browser.')).toBeVisible();
  expect(await attemptsFor(mia)).toHaveLength(1);

  await importGuestPractice(page, leo, 'Leo');
  await expect(page.getByText('1 already belong to another learner and were left alone.', { exact: false })).toBeVisible();
  expect(await attemptsFor(leo)).toHaveLength(0);
  expect(await guestRecords(page)).toBe(guest);

  await page.goto(`/family/children/${mia}`);
  await expect(page.getByText('Imported from guest practice', { exact: false })).toBeVisible();
});

test('a browser without guest practice says so and imports nothing', async ({ page }) => {
  await createVerifiedParent(page, 'import-empty');
  const mia = await addLearner(page, 'Mia');
  await page.goto(`/family/children/${mia}`);
  await page.getByRole('button', { name: 'Check this browser for guest practice' }).click();
  await expect(page.getByText('No guest practice was found on this browser.')).toBeVisible();
  expect(await attemptsFor(mia)).toHaveLength(0);
});
