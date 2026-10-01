import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3100';
const channel = process.env.E2E_BROWSER_CHANNEL || undefined;
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

/**
 * End-to-end checks run against a deployment that uses the development database branch and captured email. Locally
 * that is `pnpm build` plus the server started here; for a preview, set E2E_BASE_URL and the Vercel bypass secret.
 */
export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL,
    channel,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: bypass ? { 'x-vercel-protection-bypass': bypass, 'x-vercel-set-bypass-cookie': 'true' } : undefined
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } }
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'pnpm start',
        url: `${baseURL}/signin`,
        reuseExistingServer: true,
        timeout: 60_000,
        env: { PORT: '3100', BETTER_AUTH_URL: baseURL }
      }
});
