import { createVerifiedParent, expect, openEmailLink, PASSWORD, signIn, signOut, signUp, test, testEmail } from './support';

const WRONG_PASSWORD = 'That email and password do not match an account.';

test('a parent signs up, confirms by email, signs out and in, and recovers access with a reset link', async ({ page, browser }) => {
  const email = testEmail('account');
  await signUp(page, email);
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

  await signIn(page, email);
  await expect(page.getByText('Confirm your email first.', { exact: false })).toBeVisible();
  await page.goto('/family');
  await expect(page).toHaveURL(/\/signin\?next=%2Ffamily$/);

  await openEmailLink(page, email, '/api/auth/verify-email');
  await page.waitForURL('**/family/welcome');
  await expect(page.getByRole('heading', { name: 'Welcome to MeetPiano' })).toBeVisible();

  await signOut(page);
  await expect(page.getByText('Practice records for this account were removed from this browser.')).toBeVisible();
  await signIn(page, email, 'not-the-right-password');
  await expect(page.getByText(WRONG_PASSWORD)).toBeVisible();
  await signIn(page, email);
  await page.waitForURL('**/family/welcome');

  const otherDevice = await browser.newContext();
  const otherPage = await otherDevice.newPage();
  await signIn(otherPage, email);
  await otherPage.waitForURL('**/family/welcome');

  await signOut(page);
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText('a reset link is on its way', { exact: false })).toBeVisible();
  await openEmailLink(page, email, '/api/auth/reset-password/');
  await page.waitForURL(/\/reset-password\?token=/);
  const newPassword = 'e2e-Changed-Password-2026';
  await page.getByLabel('New password', { exact: true }).fill(newPassword);
  await page.getByLabel('Confirm new password').fill(newPassword);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await page.waitForURL('**/signin?reset=1');

  await otherPage.goto('/family');
  await expect(otherPage).toHaveURL(/\/signin\?next=%2Ffamily$/);
  await otherDevice.close();

  await signIn(page, email, PASSWORD);
  await expect(page.getByText(WRONG_PASSWORD)).toBeVisible();
  await signIn(page, email, newPassword);
  await page.waitForURL('**/family/welcome');
});

test('sign-in returns only to same-site paths', async ({ page }) => {
  const email = await createVerifiedParent(page, 'return-path');
  await signOut(page);
  await signIn(page, email, PASSWORD, 'https://evil.example/steal');
  await page.waitForURL('**/family/welcome');
  expect(page.url()).not.toContain('evil.example');
  await signOut(page);
  await signIn(page, email, PASSWORD, '//evil.example/steal');
  await page.waitForURL('**/family/welcome');
  expect(page.url()).not.toContain('evil.example');
});

test('reusing a reset link fails and an emailed address that has an account is not revealed', async ({ page }) => {
  const email = await createVerifiedParent(page, 'reset-reuse');
  await signOut(page);
  for (const address of [email, testEmail('nobody')]) {
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(address);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText('If that address has a MeetPiano account, a reset link is on its way.', { exact: false })).toBeVisible();
  }
  await openEmailLink(page, email, '/api/auth/reset-password/');
  const resetUrl = page.url();
  const newPassword = 'e2e-Once-Only-Password-2026';
  await page.getByLabel('New password', { exact: true }).fill(newPassword);
  await page.getByLabel('Confirm new password').fill(newPassword);
  await page.getByRole('button', { name: 'Save new password' }).click();
  await page.waitForURL('**/signin?reset=1');

  await page.goto(resetUrl);
  await page.getByLabel('New password', { exact: true }).fill('e2e-Second-Try-Password-2026');
  await page.getByLabel('Confirm new password').fill('e2e-Second-Try-Password-2026');
  await page.getByRole('button', { name: 'Save new password' }).click();
  await expect(page.getByText('This link has expired or was already used.', { exact: false })).toBeVisible();
});
