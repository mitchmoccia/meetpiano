import type { Locator } from '@playwright/test';
import { attemptsFor, closeDatabase, rows } from './db';
import { addLearner, createVerifiedParent, expect, PASSWORD, playMeetTheKeyboard, test } from './support';

test.afterAll(closeDatabase);

async function nickname(childId: string): Promise<string | null> {
  const [row] = await rows<{ nickname: string }>('select nickname from child_profile where id = $1', [childId]);
  return row?.nickname ?? null;
}

/** Points a form's hidden learner id at another family's learner, as a parent could in the browser's developer tools. */
async function retarget(form: Locator, childId: string): Promise<void> {
  await form.locator('input[name="childId"]').evaluate((input, value) => {
    (input as HTMLInputElement).value = value;
  }, childId);
}

test('another parent cannot open, choose, edit, delete, import into, or export a learner by changing ids', async ({ page, browser }) => {
  await createVerifiedParent(page, 'family-a');
  const mia = await addLearner(page, 'Mia');

  const intruderContext = await browser.newContext();
  const intruder = await intruderContext.newPage();
  await playMeetTheKeyboard(intruder);
  await createVerifiedParent(intruder, 'family-b');
  const zed = await addLearner(intruder, 'Zed');

  const direct = await intruder.goto(`/family/children/${mia}`);
  expect(direct?.status()).toBe(404);
  await expect(intruder.getByText('Mia')).toHaveCount(0);
  await intruder.goto(`/family/welcome?child=${mia}`);
  await intruder.waitForURL('**/family');
  await expect(intruder.getByText('Mia')).toHaveCount(0);

  await intruder.goto('/play');
  const zedButton = intruder.getByRole('button', { name: 'Zed', exact: true });
  await retarget(intruder.locator('form', { has: zedButton }), mia);
  await zedButton.click();
  await intruder.waitForURL('**/play?reason=choose');
  const learnerCookie = (await intruderContext.cookies()).find((cookie) => cookie.name === 'mp_learner');
  expect(learnerCookie?.value ?? '').not.toBe(mia);

  await intruder.goto(`/family/children/${zed}`);
  const editForm = intruder.locator('form', { has: intruder.getByRole('button', { name: 'Save changes' }) });
  await retarget(editForm, mia);
  await editForm.getByLabel('Nickname').fill('Taken');
  await editForm.getByRole('button', { name: 'Save changes' }).click();
  await expect(editForm.getByRole('alert')).toHaveText('That learner was not found.');

  const deleteForm = intruder.locator('form', { has: intruder.getByRole('button', { name: 'Delete Zed' }) });
  await retarget(deleteForm, mia);
  await deleteForm.getByRole('checkbox').check();
  await deleteForm.getByLabel('Account password').fill(PASSWORD);
  await deleteForm.getByRole('button', { name: 'Delete Zed' }).click();
  await expect(deleteForm.getByRole('alert')).toHaveText('That learner was not found.');
  expect(await nickname(mia)).toBe('Mia');
  expect(await nickname(zed)).toBe('Zed');

  await intruder.route(`**/family/children/${zed}`, async (route) => {
    const request = route.request();
    if (request.method() !== 'POST' || !request.headers()['next-action']) return route.continue();
    return route.continue({ postData: (request.postData() ?? '').replaceAll(zed, mia) });
  });
  await intruder.reload();
  await intruder.getByRole('button', { name: 'Check this browser for guest practice' }).click();
  await intruder.getByLabel('These guest tries on this browser were done by Zed.').check();
  await intruder.getByRole('button', { name: 'Import to Zed' }).click();
  const guestCard = intruder.locator('section').filter({ has: intruder.getByRole('heading', { name: 'Guest practice on this browser' }) });
  await expect(guestCard.getByRole('alert')).toHaveText('That learner was not found.');
  expect(await attemptsFor(mia)).toHaveLength(0);
  expect(await attemptsFor(zed)).toHaveLength(0);
  await intruder.unrouteAll();

  const exported = await intruder.request.get('/api/family/export');
  expect(exported.status()).toBe(200);
  const data = (await exported.json()) as { learners: Array<{ nickname: string }> };
  expect(data.learners.map((learner) => learner.nickname)).toEqual(['Zed']);
  expect(JSON.stringify(data)).not.toContain(mia);
  await intruderContext.close();

  await page.goto(`/family/children/${mia}`);
  await expect(page.getByRole('heading', { name: 'Mia', level: 1 })).toBeVisible();
});
