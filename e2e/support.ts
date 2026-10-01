import { test as base, expect, type Locator, type Page, type Response } from '@playwright/test';

export { expect };

export const PASSWORD = 'e2e-Practice-2026!';

const LOCAL_SERVER = !process.env.E2E_BASE_URL;

function octet(): number {
  return 1 + Math.floor(Math.random() * 254);
}

/**
 * Better Auth limits sign-ups and sign-ins per client address. Against the local server each test sends its own
 * forwarded address so the suite is not throttled by its own sign-ups; on Vercel the platform sets the address.
 */
export const test = base.extend({
  extraHTTPHeaders: async ({ extraHTTPHeaders }, provide) => {
    const address = { 'x-forwarded-for': `10.${octet()}.${octet()}.${octet()}` };
    await provide(LOCAL_SERVER ? { ...extraHTTPHeaders, ...address } : extraHTTPHeaders);
  }
});

/** Synthetic addresses on a reserved .test domain; only these appear in the development mailbox. */
export function testEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.meetpiano.test`;
}

/** Follows the newest captured email link for this address whose URL contains the fragment. */
export async function openEmailLink(page: Page, email: string, fragment: string): Promise<void> {
  let href: string | null = null;
  await expect(async () => {
    await page.goto(`/dev/mailbox?to=${encodeURIComponent(email)}`);
    href = await page.locator(`a[href*="${fragment}"]`).first().getAttribute('href', { timeout: 1_000 });
    expect(href).toBeTruthy();
  }).toPass({ timeout: 20_000 });
  await page.goto(href ?? '');
}

export async function signUp(page: Page, email: string, password = PASSWORD): Promise<void> {
  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByLabel(/parent or guardian aged 18/).check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/check-email');
}

/** Sign-up, then the emailed confirmation link, which signs the parent in and opens the welcome page. */
export async function createVerifiedParent(page: Page, label: string, password = PASSWORD): Promise<string> {
  const email = testEmail(label);
  await signUp(page, email, password);
  await openEmailLink(page, email, '/api/auth/verify-email');
  await page.waitForURL('**/family/welcome');
  return email;
}

export async function signIn(page: Page, email: string, password = PASSWORD, next?: string): Promise<void> {
  await page.goto(next ? `/signin?next=${encodeURIComponent(next)}` : '/signin');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Sign out' }).click();
  const anyway = page.getByRole('button', { name: 'Sign out anyway' });
  await expect(anyway.or(page.getByText(/^Signed out\./))).toBeVisible();
  if (await anyway.isVisible()) await anyway.click();
  await page.waitForURL('**/signin?signedOut=1');
}

/** Adds a learner from the welcome page (first learner) or the add-learner page, and returns its id. */
export async function addLearner(page: Page, nickname: string, avatarLabel = 'Sun'): Promise<string> {
  if (!page.url().endsWith('/family/welcome')) await page.goto('/family/children/new');
  await page.getByLabel('Nickname').fill(nickname);
  const avatar = page.getByRole('radio', { name: avatarLabel, exact: true });
  await page.locator('label', { has: avatar }).click();
  await expect(avatar).toBeChecked();
  await page.getByRole('button', { name: 'Add learner' }).click();
  await page.waitForURL(/\/family\/(welcome\?child=|children\/)[0-9a-f-]{36}/);
  const id = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.exec(page.url())?.[0];
  if (!id) throw new Error(`No learner id in ${page.url()}`);
  return id;
}

export async function chooseLearner(page: Page, nickname: string): Promise<void> {
  await page.goto('/play');
  await page.getByRole('button', { name: nickname, exact: true }).click();
  await page.waitForURL('**/learn/');
  await expect(page.locator('#learner-bar')).toContainText(`Practicing as ${nickname}`);
}

export type SentAttempt = {
  clientAttemptId: string;
  lessonId: string;
  revision: number;
  evidenceState: string | null;
  completedAt: string | null;
  [field: string]: unknown;
};
export type Envelope = { userId: string; entries: Array<{ childId: string; attempt: SentAttempt }> };
export type SaveResult = { clientAttemptId: string; status: string; revision?: number; reason?: string };

export function isAttemptsPost(response: Response): boolean {
  return response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/learner/attempts';
}

function finishesLesson(response: Response, lessonId: string): boolean {
  if (!isAttemptsPost(response) || !response.ok()) return false;
  const envelope = response.request().postDataJSON() as Envelope;
  return envelope.entries.some((entry) => entry.attempt.lessonId === lessonId && entry.attempt.completedAt);
}

export type PianoInput = 'touch' | 'computer-keys';

const COMPUTER_KEY_FOR: Record<number, string> = { 60: 'a', 61: 'w', 66: 't', 71: 'j' };

export function pianoKey(page: Page, note: number): Locator {
  return page.locator(`#piano .piano-key[data-note="${note}"]`);
}

/** High then low, a two-black group then a three-black group: the guided L01 check. */
export async function playGuidedNotes(page: Page, input: PianoInput, play?: (note: number) => Promise<void>): Promise<void> {
  for (const note of [71, 60, 61, 66]) {
    if (play) await play(note);
    else if (input === 'touch') await pianoKey(page, note).click();
    else await page.keyboard.press(COMPUTER_KEY_FOR[note] ?? '');
  }
}

/** Pointer players click; keyboard-only players focus the button and press Enter. */
async function activate(page: Page, name: string, input: PianoInput): Promise<void> {
  const button = page.getByRole('button', { name, exact: true });
  if (input === 'touch') await button.click();
  else await button.press('Enter');
}

/** Plays L01 through the guided check, then saves and finishes for now (a Practiced try). */
export async function playMeetTheKeyboard(page: Page, input: PianoInput = 'touch'): Promise<void> {
  await page.goto('/learn/?lesson=L01');
  await activate(page, 'Show me the keyboard', input);
  await activate(page, 'Now you try', input);
  await playGuidedNotes(page, input);
  await activate(page, 'Continue to a quiet check', input);
  await activate(page, 'Save and finish for now', input);
}

/** Plays L01 as the chosen learner and waits until the server has accepted the finished try. */
export async function finishMeetTheKeyboard(page: Page): Promise<{ envelope: Envelope; results: SaveResult[] }> {
  const accepted = page.waitForResponse((response) => finishesLesson(response, 'L01'));
  await playMeetTheKeyboard(page);
  const response = await accepted;
  const envelope = response.request().postDataJSON() as Envelope;
  const { results } = (await response.json()) as { results: SaveResult[] };
  expect(results.map((result) => result.status)).not.toContain('rejected');
  await expect(page.locator('.learner-status')).toHaveText('Saved');
  return { envelope, results };
}

/** A lesson card on the journey hub at /learn/. */
export function hubCard(page: Page, lessonId: string): Locator {
  return page.locator('li.unit-card').filter({ has: page.locator('.unit-id', { hasText: new RegExp(`^${lessonId}$`) }) });
}

/** Learner namespaces and the cached learner context this browser holds. */
export function learnerStorageKeys(page: Page): Promise<string[]> {
  return page.evaluate(() => Object.keys(window.localStorage).filter((key) => key.startsWith('meetpiano:learner:v1:')));
}
