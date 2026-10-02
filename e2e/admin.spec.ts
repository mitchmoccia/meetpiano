import type { Page, Request } from '@playwright/test';
import { closeDatabase, grantAdmin, rows } from './db';
import { addLearner, chooseLearner, createVerifiedParent, expect, finishMeetTheKeyboard, hubCard, signOut, test } from './support';

test.afterAll(closeDatabase);

const ADMIN_PAGES = ['/admin', '/admin/curriculum', '/admin/families', '/admin/saves', '/admin/audit'];
const LESSON = 'L03';
const HOME_POSITION = 2;

async function lessonState(): Promise<{ status: string; position: number }> {
  const [row] = await rows<{ status: string; position: number }>('select status, position from curriculum_lesson where id = $1', [LESSON]);
  if (!row) throw new Error(`${LESSON} is not in the curriculum table.`);
  return row;
}

async function userId(email: string): Promise<string> {
  const [row] = await rows<{ id: string }>('select id from auth_user where email = $1', [email]);
  if (!row) throw new Error(`No user for ${email}`);
  return row.id;
}

async function setStatus(page: Page, status: 'available' | 'paused', note: string): Promise<void> {
  const row = page.locator(`#lesson-${LESSON}`);
  await row.getByRole('combobox', { name: /^Status/ }).selectOption(status);
  await row.getByRole('textbox', { name: /^Internal note/ }).fill(note);
  await row.getByRole('button', { name: `Save status for ${LESSON}` }).click();
  await expect.poll(async () => (await lessonState()).status).toBe(status);
}

async function move(page: Page, direction: 'up' | 'down'): Promise<void> {
  const before = (await lessonState()).position;
  await page.locator(`#lesson-${LESSON}`).getByRole('button', { name: `Move ${LESSON} ${direction}` }).click();
  await expect.poll(async () => (await lessonState()).position).toBe(before + (direction === 'down' ? 1 : -1));
}

/** Puts the shared development curriculum back the way the code orders it, through the admin screens. */
async function restoreLesson(page: Page): Promise<void> {
  const state = await lessonState();
  if (state.status === 'available' && state.position === HOME_POSITION) return;
  await page.goto('/admin/curriculum');
  if (state.status !== 'available') await setStatus(page, 'available', '');
  while ((await lessonState()).position > HOME_POSITION) await move(page, 'up');
}

async function hubOrder(page: Page): Promise<string[]> {
  return page.locator('li.unit-card .unit-id').allTextContents();
}

/** Sends a captured admin request again from another account's session. */
function replay(page: Page, request: Request) {
  const headers = request.headers();
  return page.request.fetch(request.url(), {
    method: 'POST',
    headers: { 'next-action': headers['next-action'] ?? '', 'content-type': headers['content-type'] ?? '', origin: new URL(request.url()).origin },
    data: request.postDataBuffer() ?? undefined,
    maxRedirects: 0
  });
}

test('a parent who was not granted admin gets a plain 404 on every admin page', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/signin\?next=%2Fadmin$/);
  await createVerifiedParent(page, 'not-admin');
  for (const path of ADMIN_PAGES) {
    expect((await page.goto(path))?.status(), path).toBe(404);
  }
});

test('an operator-granted admin pauses and reorders a lesson for family learners, views a pilot family, and is audited', async ({ page, browser }) => {
  const familyContext = await browser.newContext();
  const family = await familyContext.newPage();
  const familyEmail = await createVerifiedParent(family, 'pilot');
  await addLearner(family, 'Mia');
  await chooseLearner(family, 'Mia');
  await finishMeetTheKeyboard(family);

  const adminEmail = await createVerifiedParent(page, 'admin');
  expect((await page.goto('/admin'))?.status()).toBe(404);
  expect(grantAdmin(adminEmail)).toContain('Admin access granted on the development branch.');
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Admin', level: 1 })).toBeVisible();

  try {
    await page.goto('/admin/curriculum');
    const pauseRequest = page.waitForRequest((request) => request.method() === 'POST' && Boolean(request.headers()['next-action']));
    await setStatus(page, 'paused', 'end-to-end pause check');
    const captured = await pauseRequest;
    await expect(page.getByText('Status saved.')).toBeVisible();
    await expect(page.locator(`#lesson-${LESSON}`)).toContainText('Paused');
    await move(page, 'down');
    await expect(page.getByText('Order saved.')).toBeVisible();

    await chooseLearner(family, 'Mia');
    await expect(hubCard(family, LESSON).locator('.unit-state')).toHaveText('Paused');
    const familyOrder = await hubOrder(family);
    expect(familyOrder.indexOf('L04')).toBeLessThan(familyOrder.indexOf(LESSON));

    const guestContext = await browser.newContext();
    const guest = await guestContext.newPage();
    await guest.goto('/learn/');
    await expect(hubCard(guest, LESSON).locator('.unit-state')).not.toHaveText('Paused');
    const guestOrder = await hubOrder(guest);
    expect(guestOrder.indexOf(LESSON)).toBeLessThan(guestOrder.indexOf('L04'));
    await guestContext.close();

    await restoreLesson(page);
    await family.goto('/family');
    const replayed = await replay(family, captured);
    expect(replayed.status()).toBe(404);
    expect(await lessonState()).toEqual({ status: 'available', position: HOME_POSITION });
  } finally {
    await restoreLesson(page);
  }

  await page.goto('/admin/families');
  await page.getByRole('link', { name: familyEmail }).click();
  await expect(page.getByRole('heading', { name: familyEmail, level: 1 })).toBeVisible();
  const learner = page.getByRole('region', { name: /^Mia added/ });
  await expect(learner.getByRole('table', { name: 'Progress for Mia' })).toContainText('L01 · Meet the keyboard');
  await expect(learner.getByRole('table', { name: 'Latest tries for Mia' })).toContainText('live');
  await expect(page.getByRole('button', { name: /delete|edit|save/i })).toHaveCount(0);

  await page.goto('/admin/audit');
  const adminId = await userId(adminEmail);
  const actions = await rows<{ action: string; target_id: string }>(
    'select action, target_id from admin_audit_log where actor_user_id = $1 or target_id = $1 order by created_at',
    [adminId]
  );
  expect(actions.map((entry) => entry.action)).toEqual([
    'admin.granted',
    'lesson.status_changed',
    'lesson.moved',
    'lesson.status_changed',
    'lesson.moved',
    'family.viewed'
  ]);
  await expect(page.getByRole('cell', { name: 'family.viewed' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: adminEmail }).first()).toBeVisible();

  await signOut(page);
  expect((await page.goto('/admin/audit'))?.url()).toContain('/signin?next=%2Fadmin%2Faudit');
  await familyContext.close();
});
